import os
import shutil
import tempfile
import time
import logging
import asyncio
from typing import List, Dict, Any

from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form, Path
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv()
from config import Config

from src.schemas import (
    DocumentUploadResponse, SummaryResponse, ChatRequest, ChatResponse,
    DocumentListResponse, DocumentDetail
)
from src.summary_service import SummaryService
from src.firebase_service import get_current_user, FirebaseService
from src.supabase_service import SupabaseService
from src.input_validator import InputValidator
from src.faiss_vector_store import FAISSVectorStore
from src.embedding_generator import EmbeddingGenerator
from src.answer_generation_engine import AnswerGenerationEngine
from src.query_resolver import QueryResolver

logging.basicConfig(level=getattr(logging, Config.LOG_LEVEL, "INFO"))

# Initialize global services that don't need per-request instantiation
supabase_service = SupabaseService()
# We don't instantiate firebase here as it's done via dependency injection

@asynccontextmanager
async def lifespan(app: FastAPI):
    logging.info("DocLens backend starting up...")
    
    # Initialize core processing services
    app.state.summary_service = SummaryService()
    
    # Initialize services for Q&A (RAG)
    app.state.embedding_engine = EmbeddingGenerator()
    app.state.vector_store = FAISSVectorStore(app.state.embedding_engine.get_embedding_dimension())
    app.state.query_processor = QueryResolver(app.state.embedding_engine, app.state.vector_store)
    app.state.answer_engine = AnswerGenerationEngine()
    app.state.validator = InputValidator()
    
    yield
    
    logging.info("DocLens backend shutting down...")
    app.state.summary_service.executor.shutdown(wait=True)

app = FastAPI(
    title="DocLens Document Summary Assistant",
    description="Intelligent document processing, summarization, and Q&A using Gemini AI",
    version="2.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------------------
# DocLens Endpoints
# -------------------------------------------------------------------------

@app.post("/api/documents/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    summary_length: str = Form("medium"),
    user: dict = Depends(get_current_user)
):
    """
    Uploads a document, extracts text (OCR if needed), and generates a summary.
    Saves the result to Supabase associated with the authenticated user.
    """
    if summary_length not in ["short", "medium", "long"]:
        raise HTTPException(status_code=400, detail="summary_length must be short, medium, or long")
        
    request_start_time = time.time()
    tmp_path = None
    
    try:
        # Validate file
        suffix = os.path.splitext(file.filename or "upload")[1] or ".bin"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name

        doc_uri = f"file://{tmp_path}"
        
        # Process and summarize
        result = await app.state.summary_service.process_and_summarize(doc_uri, summary_length)
        
        # Save to DB
        doc_data = {
            "filename": file.filename,
            "file_type": suffix,
            "summary_data": result["summary_data"]
        }
        
        doc_id = supabase_service.save_document(user["uid"], doc_data)
        
        # Also cache the document in the vector store so we can chat immediately
        # In a real app we'd load this on demand per document ID
        await app.state.vector_store.clear()
        embeddings = await app.state.embedding_engine.generate_embeddings(result["chunks"])
        await app.state.vector_store.add_documents(result["chunks"], embeddings)
        
        logging.info(f"Upload complete in {time.time() - request_start_time:.2f}s")
        return DocumentUploadResponse(
            document_id=doc_id,
            filename=file.filename,
            summary_data=result["summary_data"]
        )
        
    except Exception as e:
        logging.error(f"Error processing upload: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)


@app.get("/api/documents", response_model=DocumentListResponse)
async def list_documents(user: dict = Depends(get_current_user)):
    """List all documents for the authenticated user"""
    docs = supabase_service.get_user_documents(user["uid"])
    
    # Map to schema
    mapped_docs = []
    for doc in docs:
        mapped_docs.append(DocumentDetail(
            id=doc.get("id"),
            filename=doc.get("filename"),
            original_file_type=doc.get("original_file_type", ""),
            upload_timestamp=doc.get("upload_timestamp", str(doc.get("created_at", ""))),
            summary=doc.get("summary"),
            summary_length=doc.get("summary_length"),
            key_points=doc.get("key_points", []),
            main_ideas=doc.get("main_ideas", []),
            improvement_suggestions=doc.get("improvement_suggestions", [])
        ))
        
    return DocumentListResponse(documents=mapped_docs)


@app.get("/api/documents/{doc_id}", response_model=DocumentDetail)
async def get_document(doc_id: str, user: dict = Depends(get_current_user)):
    """Get a specific document detail"""
    doc = supabase_service.get_document(user["uid"], doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    return DocumentDetail(
        id=doc.get("id"),
        filename=doc.get("filename"),
        original_file_type=doc.get("original_file_type", ""),
        upload_timestamp=doc.get("upload_timestamp", str(doc.get("created_at", ""))),
        summary=doc.get("summary"),
        summary_length=doc.get("summary_length"),
        key_points=doc.get("key_points", []),
        main_ideas=doc.get("main_ideas", []),
        improvement_suggestions=doc.get("improvement_suggestions", [])
    )


@app.delete("/api/documents/{doc_id}")
async def delete_document(doc_id: str, user: dict = Depends(get_current_user)):
    """Delete a document"""
    success = supabase_service.delete_document(user["uid"], doc_id)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found or could not be deleted")
    return {"status": "success"}


@app.post("/api/documents/{doc_id}/chat", response_model=ChatResponse)
async def document_chat(
    doc_id: str, 
    request: ChatRequest,
    user: dict = Depends(get_current_user)
):
    """
    Ask a question about a specific document.
    """
    # 1. Verify access
    doc = supabase_service.get_document(user["uid"], doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    # 2. Save user message
    supabase_service.save_chat_message(user["uid"], doc_id, "user", request.question)
    
    try:
        # Note: In a full production system, we'd reload the document chunks into FAISS here
        # based on doc_id if they aren't already loaded. For simplicity, we assume they are
        # currently in the vector store from a recent upload or we'd process them again.
        
        # 3. RAG pipeline to answer the question
        answers = await app.state.query_processor.process_queries_parallel(
            [request.question], 
            app.state.vector_store.documents,
            app.state.answer_engine
        )
        
        answer_text = answers[0] if answers else "I could not find an answer."
        
        # 4. Save assistant message
        supabase_service.save_chat_message(user["uid"], doc_id, "assistant", answer_text)
        
        return ChatResponse(
            answer=answer_text,
            confidence=0.85 # Mocked confidence
        )
    except Exception as e:
        logging.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate answer")


@app.get("/api/documents/{doc_id}/chat")
async def get_document_chat(doc_id: str, user: dict = Depends(get_current_user)):
    """Get chat history for a document"""
    doc = supabase_service.get_document(user["uid"], doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    history = supabase_service.get_chat_history(user["uid"], doc_id)
    return {"messages": history}


@app.get("/health")
async def health_check():
    """Returns a health status to indicate the service is running."""
    return {"status": "healthy", "service": "doclens-backend"}

if __name__ == "__main__":
    uvicorn.run("start_server:app", host="0.0.0.0", port=8000, reload=True)
