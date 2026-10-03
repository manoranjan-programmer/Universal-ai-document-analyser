"""
Universal AI Document Analyzer
================================
Search API Routes.

Endpoints:
    POST /api/search  — Semantic search over indexed documents
"""

import logging
from fastapi import APIRouter, HTTPException

from app.config import get_settings
from app.embeddings.embedder import embed_query
from app.retrieval.faiss_store import get_vector_store
from app.models.schemas import SearchRequest, SearchResponse, SourceChunk

logger = logging.getLogger(__name__)
settings = get_settings()
router = APIRouter()


@router.post("/search", response_model=SearchResponse)
async def semantic_search(request: SearchRequest):
    """
    Perform semantic search over all indexed document chunks.

    - Embeds the query using the pretrained all-MiniLM-L6-v2 model.
    - Searches the FAISS index for the Top-K most similar chunks.
    - Optionally filters by document_id.

    Returns ranked results with similarity scores and source metadata.
    """
    store = get_vector_store()

    if store.total_chunks == 0:
        raise HTTPException(
            status_code=404,
            detail="No documents have been indexed yet. Please upload and process a document first.",
        )

    # Generate query embedding
    try:
        q_embedding = embed_query(request.query, model_name=settings.embedding_model)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to embed query: {e}",
        )

    # Semantic search
    raw_results = store.search(
        query_embedding=q_embedding,
        top_k=request.top_k,
        document_id=request.document_id,
        similarity_threshold=settings.similarity_threshold,
    )

    # Build response
    results = [
        SourceChunk(
            document_id=r["document_id"],
            filename=r["filename"],
            chunk_id=r["chunk_id"],
            text=r["text"],
            page=r.get("page"),
            similarity=r["similarity"],
            rank=r["rank"],
        )
        for r in raw_results
    ]

    return SearchResponse(
        query=request.query,
        results=results,
        total=len(results),
    )
