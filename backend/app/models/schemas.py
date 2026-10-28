"""
Universal AI Document Analyzer
================================
Pydantic schemas for request/response validation.
"""

from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field


# ══════════════════════════════════════════════════════════
#  Document Schemas
# ══════════════════════════════════════════════════════════

class DocumentStatus(str):
    PENDING    = "pending"
    PROCESSING = "processing"
    PROCESSED  = "processed"
    FAILED     = "failed"


class DocumentBase(BaseModel):
    filename:   str
    file_type:  str
    file_size:  int


class DocumentCreate(DocumentBase):
    pass


class ChunkResponse(BaseModel):
    """Represents a single document chunk with metadata."""
    document_id:  str
    filename:     str
    chunk_id:     int
    text:         str
    page:         Optional[int] = None
    word_count:   int = 0


class DocumentResponse(BaseModel):
    """Full document response returned to the frontend."""
    id:             str
    filename:       str
    file_type:      str
    file_size:      int
    status:         str
    chunks_count:   int = 0
    pages:          int = 0
    extracted_text: Optional[str] = None
    upload_date:    datetime
    error_message:  Optional[str] = None

    class Config:
        from_attributes = True


class DocumentListResponse(BaseModel):
    """Paginated list of documents."""
    documents:    List[DocumentResponse]
    total:        int
    processed:    int
    failed:       int
    total_chunks: int


# ══════════════════════════════════════════════════════════
#  Processing Schemas
# ══════════════════════════════════════════════════════════

class ProcessingStep(BaseModel):
    """Represents a single step in the document processing pipeline."""
    step:    str
    status:  str          # "success" | "error" | "skipped"
    message: str = ""


class ProcessingResult(BaseModel):
    """Result of processing a document through the full pipeline."""
    document_id:     str
    filename:        str
    steps:           List[ProcessingStep]
    total_pages:     int = 0
    total_chunks:    int = 0
    extracted_text:  str = ""
    success:         bool = True
    error:           Optional[str] = None


# ══════════════════════════════════════════════════════════
#  Search Schemas
# ══════════════════════════════════════════════════════════

class SearchRequest(BaseModel):
    """User semantic search request."""
    query:       str = Field(..., min_length=1, max_length=1000)
    top_k:       int = Field(default=5, ge=1, le=20)
    document_id: Optional[str] = None   # Optionally limit to one document


class SourceChunk(BaseModel):
    """A retrieved source chunk with similarity metadata."""
    document_id:  str
    filename:     str
    chunk_id:     int
    text:         str
    page:         Optional[int] = None
    similarity:   float
    rank:         int


class SearchResponse(BaseModel):
    """Result of a semantic search."""
    query:   str
    results: List[SourceChunk]
    total:   int


# ══════════════════════════════════════════════════════════
#  Chat / RAG Schemas
# ══════════════════════════════════════════════════════════

class ChatMessage(BaseModel):
    """A single message in a conversation."""
    role:    str   # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    """User question request to the RAG pipeline."""
    question:    str = Field(..., min_length=1, max_length=2000)
    document_id: Optional[str] = None   # Restrict to a specific document
    history:     List[ChatMessage] = Field(default_factory=list)
    top_k:       int = Field(default=5, ge=1, le=20)


class ChatResponse(BaseModel):
    """Full RAG response with answer and cited sources."""
    model_config = {"protected_namespaces": ()}

    question:       str
    answer:         str
    sources:        List[SourceChunk]
    model_used:     str
    tokens_used:    Optional[int] = None
    retrieved_chunks: int = 0
