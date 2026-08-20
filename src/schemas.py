from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class ChatMessage(BaseModel):
    role: str
    content: str
    created_at: Optional[str] = None

class ChatRequest(BaseModel):
    question: str
    history: List[ChatMessage] = []

class ChatResponse(BaseModel):
    answer: str
    confidence: float

class SummaryResponse(BaseModel):
    summary: str
    summary_length: str
    key_points: List[str]
    main_ideas: List[str]
    improvement_suggestions: List[str]
    document_type: str
    confidence: float

class DocumentUploadResponse(BaseModel):
    document_id: str
    filename: str
    summary_data: SummaryResponse

class DocumentDetail(BaseModel):
    id: str
    filename: str
    original_file_type: str
    upload_timestamp: str
    summary: Optional[str]
    summary_length: Optional[str]
    key_points: Optional[List[str]]
    main_ideas: Optional[List[str]]
    improvement_suggestions: Optional[List[str]]

class DocumentListResponse(BaseModel):
    documents: List[DocumentDetail]
