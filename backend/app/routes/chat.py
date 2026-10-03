"""
Universal AI Document Analyzer
================================
Chat / RAG API Routes.

Endpoints:
    POST /api/chat  — Ask a question about uploaded documents (RAG pipeline)
"""

import logging
from fastapi import APIRouter, HTTPException

from app.config import get_settings
from app.retrieval.faiss_store import get_vector_store
from app.rag.rag_pipeline import run_rag_pipeline
from app.models.schemas import ChatRequest, ChatResponse

logger = logging.getLogger(__name__)
settings = get_settings()
router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat_with_documents(request: ChatRequest):
    """
    Ask a question about uploaded documents using the RAG pipeline.

    Flow:
        1. Embed the user question (all-MiniLM-L6-v2)
        2. Retrieve Top-K relevant chunks from FAISS
        3. Build a grounded prompt with retrieved context
        4. Call the configured LLM (Groq / OpenAI / HuggingFace / local)
        5. Return answer + source citations

    If no relevant context is found, responds with a clear message
    rather than hallucinating an answer.
    """
    store = get_vector_store()

    if store.total_chunks == 0:
        raise HTTPException(
            status_code=404,
            detail=(
                "No documents have been indexed yet. "
                "Please upload and process a document first."
            ),
        )

    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    try:
        response = run_rag_pipeline(
            question=request.question,
            document_id=request.document_id,
            top_k=request.top_k,
            history=request.history,
        )
        return response

    except Exception as e:
        logger.error(f"RAG pipeline error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while processing your question: {e}",
        )
