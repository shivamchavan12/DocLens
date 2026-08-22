import os
import logging
import asyncio
import json
import functools
from typing import Dict, Any, Optional
from concurrent.futures import ThreadPoolExecutor

import google.generativeai as genai
from config import Config

class GeminiService:
    """
    A specific LLM engine designed to interact with the Google Gemini API.
    It handles API key validation, text generation, structured JSON generation,
    and error logging.
    """
    def __init__(self, executor: ThreadPoolExecutor = None):
        """
        Initializes the GeminiService.
        Raises ValueError if API key is missing or invalid.
        """
        self.api_key = Config.get_gemini_key()
        if not self.api_key:
            logging.error("No valid Gemini API key found in environment variables.")
            # For the purpose of starting the server even without a key (fallback to other LLMs)
            # We don't raise an exception here immediately, but generation will fail if called.
            self.client = None
        else:
            genai.configure(api_key=self.api_key)
            self.model_name = Config.GEMINI_MODEL
            self.model = genai.GenerativeModel(self.model_name)
            
        self.executor = executor or ThreadPoolExecutor()
        logging.info("Gemini API LLM Engine initialized.")

    async def generate(self, prompt: str) -> str:
        """
        Generates a text response from the Gemini API based on the given prompt.
        Runs the synchronous API call in a thread pool executor to prevent blocking.
        """
        if not self.api_key or not self.model:
            logging.error("Cannot generate: Gemini API key is missing.")
            return ""

        loop = asyncio.get_event_loop()
        try:
            # Run the synchronous Gemini API call in the executor
            response = await loop.run_in_executor(
                self.executor,
                functools.partial(
                    self.model.generate_content,
                    prompt,
                    generation_config=genai.types.GenerationConfig(
                        temperature=Config.LLM_TEMPERATURE,
                        max_output_tokens=Config.MAX_TOKENS,
                    )
                )
            )
            return response.text.strip()
        except Exception as e:
            logging.error(f"Error generating text with Gemini: {e}")
            return ""

    async def generate_json(self, prompt: str, schema: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Generates a structured JSON response from the Gemini API.
        """
        if not self.api_key or not self.model:
            logging.error("Cannot generate JSON: Gemini API key is missing.")
            return {}

        loop = asyncio.get_event_loop()
        try:
            # Gemini JSON mode
            generation_config = genai.types.GenerationConfig(
                temperature=Config.LLM_TEMPERATURE,
                response_mime_type="application/json",
            )
            if schema:
                generation_config.response_schema = schema

            response = await loop.run_in_executor(
                self.executor,
                functools.partial(
                    self.model.generate_content,
                    prompt,
                    generation_config=generation_config
                )
            )
            
            response_text = response.text.strip()
            
            try:
                return json.loads(response_text)
            except json.JSONDecodeError:
                logging.error(f"Failed to decode JSON from Gemini response: {response_text}")
                return {}
                
        except Exception as e:
            logging.error(f"Error generating JSON with Gemini: {e}")
            return {}
