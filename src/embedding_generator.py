import numpy as np
from typing import List, Dict
import os
import asyncio
import functools
from concurrent.futures import ThreadPoolExecutor
import logging

try:
    import google.generativeai as genai
except ImportError:
    pass

class EmbeddingGenerator:
    """
    Manages the generation of embeddings using Gemini API instead of heavy local models.
    This saves ~400MB of RAM and prevents Out Of Memory crashes on Render.
    """
    def __init__(self, model_name: str = "models/embedding-001", device: str = "cpu", executor: ThreadPoolExecutor = None):
        self.model_name = model_name
        self.max_tokens = 2000 # Gemini handles larger contexts easily
        self.executor = executor
        
        # Configure Gemini
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key and api_key != "your-gemini-api-key-here":
            genai.configure(api_key=api_key)
            
    async def generate_embeddings(self, chunks: List[Dict]) -> np.ndarray:
        logging.info(f"Generating Gemini embeddings for {len(chunks)} chunks.")
        if not chunks:
            return np.array([])
            
        texts = [chunk['text'][:8000] for chunk in chunks]
        
        loop = asyncio.get_event_loop()
        all_embeddings = []
        
        # Batch chunks to avoid hitting Gemini's per-request payload limits (e.g., 50 chunks per batch)
        batch_size = 50
        for i in range(0, len(texts), batch_size):
            batch_texts = texts[i:i + batch_size]
            response = await loop.run_in_executor(
                self.executor,
                functools.partial(
                    genai.embed_content,
                    model=self.model_name,
                    content=batch_texts,
                    task_type="retrieval_document"
                )
            )
            all_embeddings.extend(response['embedding'])
            
        logging.info("Gemini embeddings generated successfully.")
        return np.array(all_embeddings, dtype=np.float32)
    
    async def generate_query_embedding(self, query: str) -> np.ndarray:
        logging.info(f"Generating query embedding for: {query[:50]}...")
        
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            self.executor,
            functools.partial(
                genai.embed_content,
                model=self.model_name,
                content=query,
                task_type="retrieval_query"
            )
        )
        
        logging.info("Query embedding generated successfully.")
        return np.array(response['embedding'], dtype=np.float32)
    
    def calculate_similarity(self, embedding1: np.ndarray, embedding2: np.ndarray) -> float:
        return np.dot(embedding1, embedding2) / (np.linalg.norm(embedding1) * np.linalg.norm(embedding2))
    
    def get_embedding_dimension(self) -> int:
        return 768  # Gemini embedding dimension

