import logging
import re
import asyncio
from typing import List, Dict, Tuple, Any
from concurrent.futures import ThreadPoolExecutor

from src.gemini_llm_engine import GeminiService
from src.mistral_api_llm_engine import MistralApiLLMEngine, MISTRAL_AVAILABLE
from src.rule_based_answer_engine import RuleBasedAnswerEngine
from src.text_cleaner_utils import clean_escape_characters

class AnswerGenerationEngine:
    """
    Orchestrates the answer generation process using a fallback strategy.
    It attempts to use the primary Gemini API first, falls back to open-source LLMs,
    and finally to a rule-based engine if others fail or return low confidence.
    """
    def __init__(self, executor: ThreadPoolExecutor = None):
        self.executor = executor or ThreadPoolExecutor(max_workers=4)
        
        # Initialize the available engines
        self.primary_engine = GeminiService(executor=self.executor)
        
        if MISTRAL_AVAILABLE:
            self.fallback_llm = MistralApiLLMEngine(executor=self.executor)
        else:
            self.fallback_llm = None
            
        self.rule_based_engine = RuleBasedAnswerEngine(executor=self.executor)
        
        self.max_context_length = 4000
        logging.info("Answer Generation Engine initialized with Fallback mechanisms (Primary: Gemini).")

    async def generate_answer(self, query: str, relevant_chunks: List[Tuple[Dict, float]], query_intent: Dict) -> str:
        """
        Generates an answer to a single query using the configured LLM or fallback.
        """
        # Handle mathematical queries specifically with the rule-based engine
        if query_intent.get('content_type') == 'mathematical':
            logging.info("Mathematical query detected. Using rule-based engine.")
            try:
                answer = await self.rule_based_engine.generate_answer(query, relevant_chunks, query_intent)
                return answer
            except Exception as e:
                logging.warning(f"Rule-based engine failed for math query: {e}. Falling back to primary.")

        # Primary Gemini API
        try:
            if getattr(self.primary_engine, 'api_key', None):
                context = self._prepare_context(relevant_chunks)
                prompt = self._build_prompt(query, context, query_intent)
                
                # Prepend the system prompt to the user prompt since Gemini handles it better this way
                full_prompt = f"System: {self._get_system_prompt()}\n\n{prompt}"
                
                answer = await self.primary_engine.generate(full_prompt)
                
                if answer and len(answer.strip()) > 5:
                    return self._post_process_answer(answer, relevant_chunks)
        except Exception as e:
            logging.error(f"Primary Gemini engine failed: {e}")

        # Fallback 1: Mistral LLM
        if self.fallback_llm:
            logging.info("Falling back to Mistral API Engine.")
            try:
                context = self._prepare_context(relevant_chunks)
                prompt = self._build_prompt(query, context, query_intent)
                full_prompt = f"System: {self._get_system_prompt()}\n\n{prompt}"
                
                answer = await self.fallback_llm.generate(full_prompt)
                if answer and len(answer.strip()) > 5:
                    return self._post_process_answer(answer, relevant_chunks)
            except Exception as e:
                logging.error(f"Mistral API fallback failed: {e}")

        # Fallback 2: Rule-Based Engine
        logging.info("Falling back to RuleBasedAnswerEngine.")
        try:
            return await self.rule_based_engine.generate_answer(query, relevant_chunks, query_intent)
        except Exception as e:
            logging.error(f"Rule-based engine failed: {e}")
            return "I apologize, but I encountered an error and could not generate an answer based on the provided documents."

    async def generate_answers_in_batch(self, queries: List[str], relevant_chunks_map: Dict[str, List[Tuple[Dict, float]]]) -> List[str]:
        """
        Generates answers for multiple queries sequentially (simplified for Gemini migration).
        """
        answers = []
        for query in queries:
            relevant_chunks = relevant_chunks_map.get(query, [])
            answer = await self.generate_answer(query, relevant_chunks, {})
            answers.append(answer)
        return answers

    def _build_prompt(self, query: str, context: str, query_intent: Dict) -> str:
        """
        Constructs the prompt for the LLM, incorporating query, context, and intent analysis.
        """
        prompt = f"""Instruction: Provide a clear, professional answer based strictly on the source material.

Source Material:
{context}

Question: {query}

Answer:"""
        return prompt

    def _get_system_prompt(self) -> str:
        """
        Returns the system prompt for single question answering.
        """
        return """You are a context-aware AI assistant providing precise answers based solely on the provided source material.
        Answers must be derived directly from the provided source content. Do not introduce new information.
        If the question is asked in a particular language, respond in that same language.
        If the answer is not in the context, say so clearly."""

    def _prepare_context(self, relevant_chunks: List[Tuple[Dict, float]]) -> str:
        """
        Prepares the context string from relevant document chunks for the LLM.
        """
        context_parts = []
        total_length = 0
        max_context_for_detailed_answers = min(self.max_context_length, 3000)

        # Sort chunks by score (desc) and length (asc)
        sorted_chunks = sorted(relevant_chunks, key=lambda x: (-x[1], len(x[0]['text'])))

        for chunk, score in sorted_chunks:
            chunk_text = chunk['text']
            chunk_length = len(chunk_text.split())

            if total_length + chunk_length > max_context_for_detailed_answers:
                continue

            # Clean chunk
            chunk_text = clean_escape_characters(chunk_text)
            chunk_text = re.sub(r'\s+', ' ', chunk_text).strip()
            
            context_parts.append(chunk_text)
            total_length += chunk_length

        return "\n\n".join(context_parts)

    def _post_process_answer(self, answer: str, relevant_chunks: List[Tuple[Dict, float]]) -> str:
        """
        Post-processes the raw answer from the LLM.
        """
        answer = answer.strip()
        answer = clean_escape_characters(answer)
        answer = re.sub(r'\s+', ' ', answer)
        
        # Remove markdown asterisks (bold/italic) that the user complained about
        answer = answer.replace('**', '').replace('*', '')

        if not answer.endswith('.'):
            answer += '.'

        # Fix URL spacing if any
        def clean_url_spacing(match):
            return match.group(0).replace(" ", "")

        answer = re.sub(r"(https?://)([a-zA-Z0-9\s\.]+)(/[^\s]*)?", clean_url_spacing, answer)
        
        return answer
