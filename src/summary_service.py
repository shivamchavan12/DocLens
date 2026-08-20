import logging
from typing import Dict, Any, List
import asyncio
from concurrent.futures import ThreadPoolExecutor

from src.gemini_llm_engine import GeminiService
from src.document_text_extractor import DocumentTextExtractor
from src.embedding_generator import EmbeddingGenerator
from src.faiss_vector_store import FAISSVectorStore

class SummaryService:
    def __init__(self, executor: ThreadPoolExecutor = None):
        self.executor = executor or ThreadPoolExecutor(max_workers=4)
        self.gemini = GeminiService(executor=self.executor)
        self.doc_extractor = DocumentTextExtractor()
        self.embedding_generator = EmbeddingGenerator()
        self.vector_store = FAISSVectorStore(embedding_generator=self.embedding_generator)
        
        logging.info("SummaryService initialized.")

    async def process_and_summarize(self, file_path: str, summary_length: str = "medium") -> Dict[str, Any]:
        """
        End-to-end pipeline:
        1. Extract text and chunks
        2. Create embeddings and store in FAISS (in memory)
        3. Ask Gemini for structured summary
        """
        logging.info(f"Processing document for summary: {file_path}")
        
        # 1. Extraction
        extraction_result = await self.doc_extractor.process_document(file_path)
        if "error" in extraction_result:
            raise ValueError(f"Extraction failed: {extraction_result['error']}")
            
        full_text = extraction_result["full_text"]
        chunks = extraction_result["chunks"]
        doc_type = extraction_result.get("detected_type", "unknown")
        
        # We optionally save to vector store if we want to do Q&A right after
        # But this function only returns the summary data
        
        # 2. Generate Summary
        summary_schema = {
            "type": "OBJECT",
            "properties": {
                "summary": {"type": "STRING", "description": "The requested summary of the document."},
                "summary_length": {"type": "STRING", "description": "short, medium, or long"},
                "key_points": {
                    "type": "ARRAY", 
                    "items": {"type": "STRING"},
                    "description": "3-7 bullet points of the most critical information"
                },
                "main_ideas": {
                    "type": "ARRAY", 
                    "items": {"type": "STRING"},
                    "description": "High-level concepts and themes discussed"
                },
                "improvement_suggestions": {
                    "type": "ARRAY", 
                    "items": {"type": "STRING"},
                    "description": "Actionable feedback, gaps, or areas for review based on the text"
                },
                "document_type": {"type": "STRING", "description": "The category of the document content"},
                "confidence": {"type": "NUMBER", "description": "Confidence score 0.0 to 1.0"}
            },
            "required": ["summary", "summary_length", "key_points", "main_ideas", "document_type", "confidence"]
        }
        
        length_instruction = {
            "short": "Provide a concise 1-2 paragraph overview.",
            "medium": "Provide a balanced summary covering major sections, around 3-4 paragraphs.",
            "long": "Provide a highly detailed, comprehensive summary preserving context, explanations, and relationships."
        }.get(summary_length, "medium")
        
        prompt = f"""You are a professional document analysis assistant. Read the following document and extract a structured analysis.
        
Instruction for Summary Length ({summary_length}): {length_instruction}

DOCUMENT CONTENT:
{full_text[:30000]} # Limit to avoid token issues for huge documents
"""
        
        summary_data = await self.gemini.generate_json(prompt, schema=summary_schema)
        
        # Fallback if generation failed
        if not summary_data:
            summary_data = {
                "summary": "Summary generation failed.",
                "summary_length": summary_length,
                "key_points": [],
                "main_ideas": [],
                "improvement_suggestions": [],
                "document_type": doc_type,
                "confidence": 0.0
            }
            
        return {
            "full_text": full_text,
            "chunks": chunks,
            "summary_data": summary_data
        }
