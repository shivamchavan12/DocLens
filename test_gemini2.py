from dotenv import load_dotenv
load_dotenv()

import google.generativeai as genai
import os
import asyncio
from src.gemini_llm_engine import GeminiService

async def main():
    service = GeminiService()
    print("Testing generate_json...")
    prompt = """You are a professional document analysis assistant. Read the following document and extract a structured analysis.
        
Instruction for Summary Length (medium): medium

IMPORTANT: You must return ONLY valid JSON matching the following structure:
{
  "summary": "The requested summary of the document (string)",
  "summary_length": "medium",
  "key_points": ["point 1", "point 2", "point 3"],
  "main_ideas": ["idea 1", "idea 2"],
  "improvement_suggestions": ["suggestion 1", "suggestion 2"],
  "document_type": "The category of the document content (string)",
  "confidence": 0.95
}

DOCUMENT CONTENT:
This is a simple test document about AI and machine learning.
"""
    # Wait, the prompt has single braces, but in the actual code it was f-string so it became single braces.
    res = await service.generate_json(prompt)
    print(f"Result: {res}")

if __name__ == "__main__":
    asyncio.run(main())
