"""
Universal AI Document Analyzer
================================
Documents API Routes.

Endpoints:
    POST   /api/documents/upload      — Upload and process a document
    GET    /api/documents             — List all documents
    GET    /api/documents/{id}        — Get a single document
    DELETE /api/documents/{id}        — Delete a document
    GET    /api/documents/{id}/chunks — Get all chunks for a document
    GET    /api/documents/stats       — Dashboard statistics
"""

import os
import logging
import shutil
from datetime import datetime
from pathlib import Path
from typing import List

from fastapi import APIRouter, File, UploadFile, HTTPException, BackgroundTasks, Query
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.services.document_service import (
    register_document,
    process_document_pipeline,
    get_document,
    get_all_documents,
    delete_document as svc_delete_document,
    get_document_stats,
)
from app.retrieval.faiss_store import get_vector_store
from app.models.schemas import DocumentResponse, DocumentListResponse, ProcessingResult

logger = logging.getLogger(__name__)
settings = get_settings()
router = APIRouter()


# ── Helpers ────────────────────────────────────────────────────────────────────

def _doc_to_response(doc: dict) -> DocumentResponse:
    upload_dt = doc.get("upload_date")
    if isinstance(upload_dt, str):
        try:
            upload_dt = datetime.fromisoformat(upload_dt)
        except Exception:
            upload_dt = datetime.utcnow()
    elif not isinstance(upload_dt, datetime):
        upload_dt = datetime.utcnow()

    return DocumentResponse(
        id=doc["id"],
        filename=doc["filename"],
        file_type=doc["file_type"],
        file_size=doc["file_size"],
        status=doc["status"],
        chunks_count=doc.get("chunks_count", 0),
        pages=doc.get("pages", 0),
        extracted_text=doc.get("extracted_text", ""),
        upload_date=upload_dt,
        error_message=doc.get("error_message"),
    )


def _validate_extension(filename: str) -> str:
    """Return lowercased extension or raise 400."""
    ext = Path(filename).suffix.lower().lstrip(".")
    if ext not in settings.allowed_extensions_list:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unsupported file type '.{ext}'. "
                f"Allowed: {', '.join(settings.allowed_extensions_list)}"
            ),
        )
    return ext


# ══════════════════════════════════════════════════════════════════════════════
#  UPLOAD
# ══════════════════════════════════════════════════════════════════════════════

@router.post("/documents/upload", response_model=ProcessingResult)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
):
    """
    Upload a document (PDF, JPG, JPEG, PNG) and process it through the AI pipeline.

    Returns processing status with step-by-step results.
    """
    # Validate file extension
    _validate_extension(file.filename)

    # Validate file size
    content = await file.read()
    if len(content) > settings.max_file_size_bytes:
        raise HTTPException(
            status_code=413,
            detail=(
                f"File too large ({len(content) / 1024 / 1024:.1f} MB). "
                f"Maximum allowed: {settings.max_file_size_mb} MB."
            ),
        )

    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # Save file to disk
    os.makedirs(settings.upload_dir, exist_ok=True)
    safe_name = Path(file.filename).name
    save_path = os.path.join(settings.upload_dir, safe_name)

    # Avoid filename conflicts by appending a timestamp
    if os.path.exists(save_path):
        stem = Path(safe_name).stem
        suffix = Path(safe_name).suffix
        ts = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        safe_name = f"{stem}_{ts}{suffix}"
        save_path = os.path.join(settings.upload_dir, safe_name)

    with open(save_path, "wb") as f:
        f.write(content)

    logger.info(f"File saved: {save_path} ({len(content)} bytes)")

    # Register document
    doc_id = register_document(
        filename=file.filename,
        file_path=save_path,
        file_size=len(content),
    )

    # Run full pipeline (synchronous for demo — could be background for prod)
    result = process_document_pipeline(doc_id)
    return result


# ══════════════════════════════════════════════════════════════════════════════
#  LIST
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/documents", response_model=DocumentListResponse)
async def list_documents():
    """Return all documents with summary statistics."""
    docs = get_all_documents()
    stats = get_document_stats()
    return DocumentListResponse(
        documents=[_doc_to_response(d) for d in docs],
        total=stats["total_documents"],
        processed=stats["processed_documents"],
        failed=stats["failed_documents"],
        total_chunks=stats["total_chunks"],
    )


# ══════════════════════════════════════════════════════════════════════════════
#  GET SINGLE
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/documents/stats")
async def document_stats():
    """Return dashboard statistics."""
    return get_document_stats()


@router.get("/documents/{document_id}", response_model=DocumentResponse)
async def get_document_by_id(document_id: str):
    """Return details for a single document."""
    doc = get_document(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail=f"Document '{document_id}' not found.")
    return _doc_to_response(doc)


# ══════════════════════════════════════════════════════════════════════════════
#  CHUNKS
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/documents/{document_id}/chunks")
async def get_document_chunks(
    document_id: str,
    limit: int = Query(default=20, ge=1, le=200),
):
    """Return all indexed chunks for a specific document."""
    doc = get_document(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail=f"Document '{document_id}' not found.")

    store = get_vector_store()
    chunks = store.get_chunks_for_document(document_id)
    return {
        "document_id": document_id,
        "filename": doc["filename"],
        "total_chunks": len(chunks),
        "chunks": chunks[:limit],
    }


# ══════════════════════════════════════════════════════════════════════════════
#  DELETE
# ══════════════════════════════════════════════════════════════════════════════

@router.delete("/documents/{document_id}")
async def delete_document(document_id: str):
    """Delete a document from the registry, FAISS index, and disk."""
    doc = get_document(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail=f"Document '{document_id}' not found.")

    success = svc_delete_document(document_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete document.")

    return {"message": f"Document '{doc['filename']}' deleted successfully."}
