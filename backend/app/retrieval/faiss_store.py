"""
Universal AI Document Analyzer
================================
FAISS Vector Store for semantic retrieval.

Architecture:
    Chunk Embeddings (numpy array)
         ↓
    FAISS IndexFlatIP  (inner product = cosine similarity when L2 normalized)
         ↓
    Top-K similarity search
         ↓
    Chunk metadata lookup

Features:
    - Add documents dynamically (runtime indexing)
    - Load pre-built index from Kaggle artifact export
    - Top-K retrieval with similarity scores
    - Per-document filtering
    - Persistence (save/load index + metadata)
"""

import os
import logging
import pickle
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path

logger = logging.getLogger(__name__)


class FAISSVectorStore:
    """
    FAISS-backed vector store for document chunk retrieval.

    Stores:
        - FAISS index (embeddings)
        - chunks_metadata: list of chunk dicts (document_id, filename, chunk_id, text, page)

    Usage:
        store = FAISSVectorStore(dimension=384)
        store.add_chunks(chunks, embeddings)
        results = store.search(query_embedding, top_k=5)
    """

    def __init__(self, dimension: int = 384):
        """
        Initialize an empty FAISS vector store.

        Args:
            dimension: Embedding dimension (384 for all-MiniLM-L6-v2).
        """
        self.dimension = dimension
        self.index = None
        self.chunks_metadata: List[Dict[str, Any]] = []
        self._init_index()

    def _init_index(self):
        """Initialize a fresh FAISS IndexFlatIP index."""
        try:
            import faiss
            # IndexFlatIP = exact inner-product search
            # When embeddings are L2-normalized, IP == cosine similarity
            self.index = faiss.IndexFlatIP(self.dimension)
            logger.info(f"FAISS IndexFlatIP initialized (dim={self.dimension})")
        except ImportError:
            raise RuntimeError(
                "faiss-cpu not installed. Run: pip install faiss-cpu"
            )

    # ──────────────────────────────────────────────────────────────────────────
    #  ADD
    # ──────────────────────────────────────────────────────────────────────────

    def add_chunks(
        self,
        chunks: List[Dict[str, Any]],
        embeddings: np.ndarray,
    ) -> int:
        """
        Add document chunks and their embeddings to the index.

        Args:
            chunks:     List of chunk metadata dicts.
            embeddings: NumPy array of shape (n_chunks, dimension).

        Returns:
            New total number of indexed chunks.
        """
        if len(chunks) != len(embeddings):
            raise ValueError(
                f"Mismatch: {len(chunks)} chunks vs {len(embeddings)} embeddings."
            )

        if len(chunks) == 0:
            logger.warning("add_chunks called with empty list — nothing added.")
            return self.total_chunks

        # Ensure float32 (FAISS requirement)
        embeddings_f32 = np.array(embeddings, dtype=np.float32)

        # L2 normalize (ensure cosine similarity correctness)
        norms = np.linalg.norm(embeddings_f32, axis=1, keepdims=True)
        norms = np.where(norms == 0, 1, norms)   # avoid division by zero
        embeddings_f32 = embeddings_f32 / norms

        self.index.add(embeddings_f32)
        self.chunks_metadata.extend(chunks)

        logger.info(
            f"Added {len(chunks)} chunks. Total indexed: {self.total_chunks}"
        )
        return self.total_chunks

    # ──────────────────────────────────────────────────────────────────────────
    #  SEARCH
    # ──────────────────────────────────────────────────────────────────────────

    def search(
        self,
        query_embedding: np.ndarray,
        top_k: int = 5,
        document_id: Optional[str] = None,
        similarity_threshold: float = 0.0,
    ) -> List[Dict[str, Any]]:
        """
        Perform Top-K semantic similarity search.

        Args:
            query_embedding:      1D NumPy array (embedding_dim,).
            top_k:                Number of results to return.
            document_id:          If set, filter results to this document only.
            similarity_threshold: Minimum similarity score to include.

        Returns:
            List of result dicts with keys:
                document_id, filename, chunk_id, text, page, similarity, rank
        """
        if self.total_chunks == 0:
            logger.warning("Search called on empty index.")
            return []

        # Prepare query vector
        q = np.array(query_embedding, dtype=np.float32).reshape(1, -1)

        # L2 normalize query
        q_norm = np.linalg.norm(q)
        if q_norm > 0:
            q = q / q_norm

        # Retrieve more than top_k if filtering by document_id
        search_k = min(self.total_chunks, top_k * 10 if document_id else top_k)

        distances, indices = self.index.search(q, search_k)

        results = []
        rank = 1
        for dist, idx in zip(distances[0], indices[0]):
            if idx < 0 or idx >= len(self.chunks_metadata):
                continue

            chunk = self.chunks_metadata[idx]
            similarity = float(dist)  # inner product ≈ cosine similarity

            # Apply threshold
            if similarity < similarity_threshold:
                continue

            # Apply document filter
            if document_id and chunk.get("document_id") != document_id:
                continue

            results.append({
                **chunk,
                "similarity": round(similarity, 4),
                "rank": rank,
            })
            rank += 1

            if rank > top_k:
                break

        return results

    # ──────────────────────────────────────────────────────────────────────────
    #  PERSISTENCE
    # ──────────────────────────────────────────────────────────────────────────

    def save(self, index_path: str, metadata_path: str):
        """
        Save the FAISS index and chunk metadata to disk.

        Args:
            index_path:    Path for FAISS index file (.faiss).
            metadata_path: Path for metadata pickle file (.pkl).
        """
        try:
            import faiss
            os.makedirs(os.path.dirname(index_path), exist_ok=True)
            os.makedirs(os.path.dirname(metadata_path), exist_ok=True)

            faiss.write_index(self.index, index_path)
            logger.info(f"FAISS index saved to: {index_path}")

            with open(metadata_path, "wb") as f:
                pickle.dump(self.chunks_metadata, f)
            logger.info(f"Metadata saved to: {metadata_path}")

        except Exception as e:
            logger.error(f"Failed to save FAISS store: {e}")
            raise

    def load(self, index_path: str, metadata_path: str) -> bool:
        """
        Load a pre-built FAISS index and metadata from disk.

        Args:
            index_path:    Path to FAISS index file.
            metadata_path: Path to metadata pickle file.

        Returns:
            True if loaded successfully, False otherwise.
        """
        try:
            import faiss

            if not os.path.exists(index_path):
                logger.warning(f"FAISS index not found at: {index_path}")
                return False

            if not os.path.exists(metadata_path):
                logger.warning(f"Metadata not found at: {metadata_path}")
                return False

            self.index = faiss.read_index(index_path)
            logger.info(f"FAISS index loaded from: {index_path}")

            with open(metadata_path, "rb") as f:
                self.chunks_metadata = pickle.load(f)
            logger.info(
                f"Metadata loaded: {len(self.chunks_metadata)} chunks"
            )
            return True

        except Exception as e:
            logger.error(f"Failed to load FAISS store: {e}")
            return False

    # ──────────────────────────────────────────────────────────────────────────
    #  MANAGEMENT
    # ──────────────────────────────────────────────────────────────────────────

    def delete_document(self, document_id: str) -> int:
        """
        Remove all chunks belonging to a document.

        NOTE: FAISS IndexFlatIP does not support deletion natively.
        We rebuild the index from scratch excluding the deleted document.

        Args:
            document_id: Document ID to remove.

        Returns:
            Number of chunks removed.
        """
        original_count = self.total_chunks
        remaining = [
            c for c in self.chunks_metadata
            if c.get("document_id") != document_id
        ]
        removed_count = original_count - len(remaining)

        if removed_count == 0:
            logger.info(f"Document '{document_id}' not found in index.")
            return 0

        # Rebuild index
        self._init_index()
        self.chunks_metadata = []

        if remaining:
            from app.embeddings.embedder import embed_texts
            texts = [c["text"] for c in remaining]
            embeddings = embed_texts(texts)
            self.add_chunks(remaining, embeddings)

        logger.info(
            f"Deleted document '{document_id}': "
            f"removed {removed_count} chunks, {self.total_chunks} remain."
        )
        return removed_count

    @property
    def total_chunks(self) -> int:
        """Total number of chunks currently indexed."""
        return len(self.chunks_metadata)

    @property
    def total_documents(self) -> int:
        """Number of unique documents currently indexed."""
        doc_ids = {c.get("document_id") for c in self.chunks_metadata}
        return len(doc_ids)

    def get_chunks_for_document(self, document_id: str) -> List[Dict[str, Any]]:
        """Return all chunks for a specific document."""
        return [
            c for c in self.chunks_metadata
            if c.get("document_id") == document_id
        ]

    def stats(self) -> Dict[str, Any]:
        """Return index statistics."""
        return {
            "total_chunks": self.total_chunks,
            "total_documents": self.total_documents,
            "embedding_dimension": self.dimension,
            "index_type": "IndexFlatIP",
        }


# ── Global singleton vector store ─────────────────────────────────────────────
_vector_store: Optional[FAISSVectorStore] = None


def get_vector_store(dimension: int = 384) -> FAISSVectorStore:
    """
    Return the global FAISSVectorStore singleton.
    Creates a new instance on first call.
    """
    global _vector_store
    if _vector_store is None:
        _vector_store = FAISSVectorStore(dimension=dimension)
    return _vector_store
