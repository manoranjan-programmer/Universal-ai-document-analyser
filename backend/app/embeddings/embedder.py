"""
Universal AI Document Analyzer
================================
Sentence Transformer Embedding Service.

Uses the pretrained model: sentence-transformers/all-MiniLM-L6-v2
Embedding dimension: 384

NOTE:
    We do NOT train this model from scratch.
    We use the pretrained all-MiniLM-L6-v2 Transformer model to generate
    semantic embeddings for document chunks and user queries.
    The model is downloaded from HuggingFace Hub on first use.

Future:
    Model can be swapped by changing EMBEDDING_MODEL in .env to:
    sentence-transformers/all-mpnet-base-v2 (768-dim)
"""

import logging
import numpy as np
from typing import List, Optional

logger = logging.getLogger(__name__)

# ── Singleton embedding model ─────────────────────────────────────────────────
_embedding_model = None
_current_model_name = None


def get_embedding_model(model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
    """
    Return the SentenceTransformer model singleton.
    Initializes on first call (lazy loading).

    Args:
        model_name: HuggingFace model ID.

    Returns:
        SentenceTransformer model instance.
    """
    global _embedding_model, _current_model_name

    if _embedding_model is None or _current_model_name != model_name:
        try:
            from sentence_transformers import SentenceTransformer
            logger.info(f"Loading embedding model: {model_name}")
            logger.info("  (First load downloads the model from HuggingFace Hub)")
            _embedding_model = SentenceTransformer(model_name)
            _current_model_name = model_name
            logger.info(f"  Embedding model loaded. Dimension: {_embedding_model.get_sentence_embedding_dimension()}")
        except ImportError:
            raise RuntimeError(
                "sentence-transformers not installed. "
                "Run: pip install sentence-transformers"
            )
        except Exception as e:
            raise RuntimeError(f"Failed to load embedding model '{model_name}': {e}")

    return _embedding_model


def embed_texts(
    texts: List[str],
    model_name: str = "sentence-transformers/all-MiniLM-L6-v2",
    batch_size: int = 32,
    show_progress: bool = False,
) -> np.ndarray:
    """
    Generate embeddings for a list of text strings.

    Args:
        texts:         List of text strings to embed.
        model_name:    HuggingFace model ID.
        batch_size:    Batch size for encoding (controls memory usage).
        show_progress: Show tqdm progress bar.

    Returns:
        NumPy array of shape (len(texts), embedding_dim).

    Raises:
        RuntimeError: If embedding fails.
        ValueError:   If texts list is empty.
    """
    if not texts:
        raise ValueError("Cannot embed empty list of texts.")

    model = get_embedding_model(model_name)

    try:
        logger.info(f"Generating embeddings for {len(texts)} text(s)...")
        embeddings = model.encode(
            texts,
            batch_size=batch_size,
            show_progress_bar=show_progress,
            convert_to_numpy=True,
            normalize_embeddings=True,   # L2 normalize for cosine similarity
        )
        logger.info(f"  Embeddings shape: {embeddings.shape}")
        return embeddings
    except Exception as e:
        logger.error(f"Embedding generation failed: {e}")
        raise RuntimeError(f"Failed to generate embeddings: {e}")


def embed_query(
    query: str,
    model_name: str = "sentence-transformers/all-MiniLM-L6-v2",
) -> np.ndarray:
    """
    Generate an embedding for a single user query.

    Args:
        query:      User question string.
        model_name: HuggingFace model ID.

    Returns:
        1D NumPy array of shape (embedding_dim,).
    """
    if not query or not query.strip():
        raise ValueError("Query cannot be empty.")

    embeddings = embed_texts([query], model_name=model_name)
    return embeddings[0]   # Return 1D vector


def get_embedding_dimension(
    model_name: str = "sentence-transformers/all-MiniLM-L6-v2",
) -> int:
    """
    Return the embedding dimension for the configured model.

    Args:
        model_name: HuggingFace model ID.

    Returns:
        Integer embedding dimension (e.g., 384 for all-MiniLM-L6-v2).
    """
    model = get_embedding_model(model_name)
    return model.get_sentence_embedding_dimension()
