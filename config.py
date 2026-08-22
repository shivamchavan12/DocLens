import os
from typing import Optional

class Config:
    """
    Configuration class for the application, managing various settings
    such as API keys, model names, logging levels, and resource limits.
    Settings are primarily loaded from environment variables.
    """
    # API Keys and Tokens
    GEMINI_API_KEY: Optional[str] = os.getenv('GEMINI_API_KEY')
    GEMINI_MODEL: str = os.getenv('GEMINI_MODEL', 'gemini-3.6-flash')
    
    @classmethod
    def get_gemini_key(cls) -> Optional[str]:
        """Returns a random available Gemini API key for load balancing."""
        import random
        keys = [k for k in [
            cls.GEMINI_API_KEY, 
            os.getenv('GEMINI_API_KEY_2'), 
            os.getenv('GEMINI_API_KEY_3')
        ] if k and k != 'your-gemini-api-key']
        return random.choice(keys) if keys else None

    # Firebase Admin SDK (Backend)
    FIREBASE_PROJECT_ID: Optional[str] = os.getenv('FIREBASE_PROJECT_ID')
    FIREBASE_CLIENT_EMAIL: Optional[str] = os.getenv('FIREBASE_CLIENT_EMAIL')
    FIREBASE_PRIVATE_KEY: Optional[str] = os.getenv('FIREBASE_PRIVATE_KEY')

    # Supabase
    SUPABASE_URL: Optional[str] = os.getenv('SUPABASE_URL')
    SUPABASE_ANON_KEY: Optional[str] = os.getenv('SUPABASE_ANON_KEY')
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

    # Legacy Keys
    MISTRAL_API_KEY: Optional[str] = os.getenv('MISTRAL_API_KEY')
    BEARER_TOKEN: Optional[str] = os.getenv('BEARER_TOKEN')

    # Directory for caching models
    MODEL_CACHE_DIR: str = os.getenv('MODEL_CACHE_DIR', '/tmp/models')

    # Logging level (e.g., 'INFO', 'DEBUG', 'WARNING')
    LOG_LEVEL: str = os.getenv('LOG_LEVEL', 'INFO')

    # Maximum number of worker threads for concurrent operations
    MAX_WORKERS: int = int(os.getenv('MAX_WORKERS', '2'))

    # Embedding model configuration
    EMBEDDING_MODEL: str = "paraphrase-MiniLM-L3-v2"
    CHUNK_SIZE: int = 512
    CHUNK_OVERLAP: int = 50
    SIMILARITY_THRESHOLD: float = 0.25
    MAX_RELEVANT_CHUNKS: int = 12

    # Large Language Model (LLM) configuration
    LLM_TEMPERATURE: float = 0.1
    MAX_TOKENS: int = 1000

    # Specific Mistral model name, configurable via environment variable
    MISTRAL_MODEL_NAME: str = os.getenv('MISTRAL_MODEL_NAME', 'mistral-small-latest')
