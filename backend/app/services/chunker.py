"""
Universal AI Document Analyzer
================================
Text chunking utilities.

Splits long document text into overlapping word-based chunks.
Each chunk carries metadata for traceability back to source document.

Configuration:
    CHUNK_SIZE    = 300 words  (configurable)
    CHUNK_OVERLAP = 50 words   (configurable)
"""

import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)


def chunk_text(
    text: str,
    document_id: str,
    filename: str,
    page: Optional[int] = None,
    chunk_size: int = 300,
    chunk_overlap: int = 50,
) -> List[Dict[str, Any]]:
    """
    Split text into overlapping word-based chunks with metadata.

    Args:
        text:         Cleaned document text.
        document_id:  Unique document identifier.
        filename:     Original filename for citation.
        page:         Source page number (if available).
        chunk_size:   Number of words per chunk.
        chunk_overlap: Number of overlapping words between chunks.

    Returns:
        List of chunk dicts with keys:
            document_id, filename, page, chunk_id, text, word_count
    """
    if not text or not text.strip():
        return []

    words = text.split()
    total_words = len(words)

    if total_words == 0:
        return []

    # Validate parameters
    chunk_size = max(chunk_size, 50)
    chunk_overlap = max(0, min(chunk_overlap, chunk_size - 1))

    chunks = []
    chunk_id = 0
    start = 0

    while start < total_words:
        end = min(start + chunk_size, total_words)
        chunk_words = words[start:end]
        chunk_text_str = " ".join(chunk_words)

        chunks.append({
            "document_id":  document_id,
            "filename":     filename,
            "page":         page,
            "chunk_id":     chunk_id,
            "text":         chunk_text_str,
            "word_count":   len(chunk_words),
        })

        chunk_id += 1

        # If we've reached the end, stop
        if end == total_words:
            break

        # Advance by (chunk_size - overlap)
        start += chunk_size - chunk_overlap

    logger.debug(
        f"Chunked '{filename}' page={page}: "
        f"{total_words} words → {len(chunks)} chunks "
        f"(size={chunk_size}, overlap={chunk_overlap})"
    )
    return chunks


def chunk_document_pages(
    page_texts: List[Dict[str, Any]],
    document_id: str,
    filename: str,
    chunk_size: int = 300,
    chunk_overlap: int = 50,
) -> List[Dict[str, Any]]:
    """
    Chunk a multi-page document by chunking each page separately.

    Args:
        page_texts:  List of {page, text} dicts from OCR.
        document_id: Unique document ID.
        filename:    Original filename.
        chunk_size:  Words per chunk.
        chunk_overlap: Overlap between chunks.

    Returns:
        Combined flat list of chunks across all pages.
        chunk_id is globally unique across the document.
    """
    all_chunks = []
    global_chunk_id = 0

    for page_info in page_texts:
        page_num = page_info.get("page")
        text = page_info.get("text", "")

        page_chunks = chunk_text(
            text=text,
            document_id=document_id,
            filename=filename,
            page=page_num,
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
        )

        # Reassign chunk IDs to be globally unique
        for chunk in page_chunks:
            chunk["chunk_id"] = global_chunk_id
            global_chunk_id += 1
            all_chunks.append(chunk)

    logger.info(
        f"Document '{filename}': {len(page_texts)} page(s) → "
        f"{len(all_chunks)} total chunks"
    )
    return all_chunks
