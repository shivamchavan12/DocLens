import logging
from typing import Dict, Any, List
import asyncio
from concurrent.futures import ThreadPoolExecutor

from src.gemini_llm_engine import GeminiService
from src.mistral_api_llm_engine import MistralApiLLMEngine, MISTRAL_AVAILABLE
from src.document_text_extractor import DocumentTextExtractor
from src.embedding_generator import EmbeddingGenerator
from src.faiss_vector_store import FAISSVectorStore

class SummaryService:
    def __init__(self, executor: ThreadPoolExecutor = None):
        self.executor = executor or ThreadPoolExecutor(max_workers=4)
        self.gemini = GeminiService(executor=self.executor)
        self.mistral = MistralApiLLMEngine(executor=self.executor) if MISTRAL_AVAILABLE else None
        self.doc_extractor = DocumentTextExtractor()
        self.embedding_generator = EmbeddingGenerator()
        self.vector_store = FAISSVectorStore(dimension=self.embedding_generator.get_embedding_dimension())
        
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
        chunks = []
        full_text = ""
        doc_type = "unknown"
        
        try:
            async for chunk in self.doc_extractor.process_document(file_path):
                chunks.append(chunk)
                full_text += chunk.get("text", "") + " "
        except Exception as e:
            raise ValueError(f"Extraction failed: {str(e)}")
        
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
                "document_type": {"type": "STRING", "description": "The category of the document content"},
                "confidence": {"type": "NUMBER", "description": "Confidence score 0.0 to 1.0"}
            },
            "required": ["summary", "summary_length", "key_points", "document_type", "confidence"]
        }
        
        length_instruction = {
            "short": "Provide a strictly ultra-concise executive summary (maximum 3 sentences or 50 words). Cut out all fluff and get straight to the point.",
            "medium": "Provide a standard executive summary (about 2-3 paragraphs, 150-250 words) that captures the core essence, major themes, and significant conclusions.",
            "long": "Provide an exhaustive, highly detailed summary (at least 4-5 paragraphs, 400+ words). Deeply analyze every major section, preserve critical data points, and explain the relationships between key concepts comprehensively."
        }.get(summary_length, "medium")
        
        prompt = f"""You are a professional document analysis assistant. Read the following document and extract a structured analysis.
        
Instruction for Summary Length ({summary_length}): {length_instruction}

IMPORTANT: You must return ONLY valid JSON matching the following structure:
{{
  "summary": "The requested summary of the document following the length instructions exactly (string)",
  "summary_length": "{summary_length}",
  "key_points": ["point 1", "point 2", "point 3"],
  "document_type": "The category of the document content (string)",
  "confidence": 0.95
}}

DOCUMENT CONTENT:
{full_text[:30000]}
"""
        
        summary_data = await self.gemini.generate_json(prompt)
        
        # Fallback to Mistral if Gemini fails
        if not summary_data and self.mistral:
            logging.warning("Gemini failed to generate summary, falling back to Mistral API...")
            summary_data = await self.mistral.generate_json(prompt)
        
        # Fallback if generation failed entirely
        if not summary_data:
            summary_data = {
                "summary": "Summary generation failed.",
                "summary_length": summary_length,
                "key_points": [],
                "document_type": doc_type,
                "confidence": 0.0
            }
            
        return {
            "full_text": full_text,
            "chunks": chunks,
            "summary_data": summary_data
        }
