"""
Universal AI Document Analyzer
================================
Central configuration module.
Loads from .env file and provides typed settings.
"""

import os
from functools import lru_cache
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    All values can be overridden via .env file.
    """

    # ── Embedding Model ────────────────────────────
    embedding_model: str = Field(
        default="sentence-transformers/all-MiniLM-L6-v2",
        description="HuggingFace model ID for sentence embeddings"
    )
    embedding_dimension: int = Field(
        default=384,
        description="Dimension of the embedding vectors"
    )

    # ── Chunking ───────────────────────────────────
    chunk_size: int = Field(
        default=300,
        description="Number of words per chunk"
    )
    chunk_overlap: int = Field(
        default=50,
        description="Number of overlapping words between consecutive chunks"
    )

    # ── Retrieval ──────────────────────────────────
    top_k: int = Field(
        default=5,
        description="Number of top similar chunks to retrieve"
    )
    similarity_threshold: float = Field(
        default=0.1,
        description="Minimum similarity score threshold for retrieval"
    )

    # ── LLM Provider ──────────────────────────────
    llm_provider: str = Field(
        default="huggingface",
        description="LLM provider: openai | groq | huggingface | local"
    )

    # OpenAI
    openai_api_key: str = Field(default="", description="OpenAI API key")
    openai_model: str = Field(default="gpt-3.5-turbo", description="OpenAI model name")

    # Groq (free tier, good for student projects)
    groq_api_key: str = Field(default="", description="Groq API key")
    groq_model: str = Field(default="openai/gpt-oss-20b", description="Groq model name")

    # HuggingFace
    hf_api_key: str = Field(default="", description="HuggingFace API key")
    hf_model: str = Field(
        default="mistralai/Mistral-7B-Instruct-v0.1",
        description="HuggingFace model name"
    )

    # ── File Upload ────────────────────────────────
    max_file_size_mb: int = Field(default=50, description="Max upload size in MB")
    upload_dir: str = Field(default="uploads", description="Directory for uploaded files")
    allowed_extensions: str = Field(
        default="pdf,jpg,jpeg,png",
        description="Comma-separated list of allowed file extensions"
    )

    # ── Artifacts ─────────────────────────────────
    artifacts_dir: str = Field(
        default="../artifacts",
        description="Path to the exported Kaggle artifacts directory"
    )

    # ── Server ────────────────────────────────────
    host: str = Field(default="0.0.0.0")
    port: int = Field(default=8000)
    debug: bool = Field(default=True)

    # ── MongoDB & Encryption ───────────────────────
    mongodb_uri: str = Field(
        default="mongodb://localhost:27017",
        description="MongoDB connection URI"
    )
    mongodb_db_name: str = Field(
        default="universal_ai_document",
        description="MongoDB database name"
    )
    mongodb_collection: str = Field(
        default="documents",
        description="MongoDB collection name for documents"
    )
    document_encryption_key: str = Field(
        default="universal-ai-document-analyzer-secret-encryption-key",
        description="Secret key or passphrase used to encrypt documents before storing in MongoDB"
    )

    # ── CORS ──────────────────────────────────────
    frontend_url: str = Field(default="http://localhost:3000")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

    @property
    def allowed_extensions_list(self) -> list[str]:
        """Returns allowed extensions as a lowercase list."""
        return [ext.strip().lower() for ext in self.allowed_extensions.split(",")]

    @property
    def max_file_size_bytes(self) -> int:
        """Returns max file size in bytes."""
        return self.max_file_size_mb * 1024 * 1024

    @property
    def resolved_artifacts_dir(self) -> str:
        """Resolves the artifacts directory regardless of current working directory."""
        if os.path.isdir(self.artifacts_dir):
            return os.path.abspath(self.artifacts_dir)
        repo_artifacts = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "..", "artifacts")
        )
        if os.path.isdir(repo_artifacts):
            return repo_artifacts
        if os.path.isdir("artifacts"):
            return os.path.abspath("artifacts")
        return os.path.abspath(self.artifacts_dir)

    @property
    def faiss_index_path(self) -> str:
        bin_path = os.path.join(self.resolved_artifacts_dir, "faiss", "faiss_index.bin")
        if os.path.exists(bin_path):
            return bin_path
        doc_path = os.path.join(self.resolved_artifacts_dir, "faiss", "document_index.faiss")
        if os.path.exists(doc_path):
            return doc_path
        return bin_path

    @property
    def metadata_path(self) -> str:
        return os.path.join(self.resolved_artifacts_dir, "metadata", "chunks_metadata.pkl")

    @property
    def artifact_config_path(self) -> str:
        return os.path.join(self.resolved_artifacts_dir, "config.json")


@lru_cache()
def get_settings() -> Settings:
    """Returns cached settings instance (singleton pattern)."""
    return Settings()
