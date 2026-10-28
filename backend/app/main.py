"""
Universal AI Document Analyzer
================================
FastAPI application entry point.
Registers all routes, CORS, and startup events.
"""

import os
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.routes import documents, search, chat

# ── Logging setup ──────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)
settings = get_settings()


# ── Lifespan (startup / shutdown) ─────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler.
    - Creates upload directory on startup.
    - Logs configuration on startup.
    - Gracefully shuts down on exit.
    """
    # ── Startup ────────────────────────────────────
    logger.info("🚀 Universal AI Document Analyzer starting up...")
    logger.info(f"   Embedding model : {settings.embedding_model}")
    logger.info(f"   LLM provider    : {settings.llm_provider}")
    logger.info(f"   Top-K retrieval : {settings.top_k}")
    logger.info(f"   Chunk size      : {settings.chunk_size} words")

    # Ensure upload directory exists
    os.makedirs(settings.upload_dir, exist_ok=True)
    os.makedirs(os.path.join(settings.resolved_artifacts_dir, "faiss"), exist_ok=True)
    os.makedirs(os.path.join(settings.resolved_artifacts_dir, "metadata"), exist_ok=True)
    logger.info(f"   Upload directory: {settings.upload_dir}")
    logger.info(f"   Artifacts dir   : {settings.resolved_artifacts_dir}")

    # Load persisted document registry and vector store
    from app.services.document_service import load_registry
    load_registry()

    yield

    # ── Shutdown ───────────────────────────────────
    logger.info("🛑 Universal AI Document Analyzer shutting down...")


# ── FastAPI App ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="Universal AI Document Analyzer",
    description=(
        "An AI-powered system for document understanding, semantic retrieval, "
        "and question answering using OCR, Sentence Transformers, FAISS, and RAG."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# ── CORS Middleware ────────────────────────────────────────────────────────────
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
if settings.frontend_url:
    for u in settings.frontend_url.split(","):
        u = u.strip()
        if u and u not in allowed_origins:
            allowed_origins.append(u)

allow_all = "*" in allowed_origins or settings.frontend_url == "*"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if allow_all else allowed_origins,
    allow_credentials=not allow_all,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(documents.router, prefix="/api", tags=["Documents"])
app.include_router(search.router,    prefix="/api", tags=["Search"])
app.include_router(chat.router,      prefix="/api", tags=["Chat"])


# ── Health Check ──────────────────────────────────────────────────────────────
@app.get("/api/health", tags=["Health"])
async def health_check():
    """Returns system health and configuration overview."""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "embedding_model": settings.embedding_model,
        "llm_provider": settings.llm_provider,
        "top_k": settings.top_k,
        "chunk_size": settings.chunk_size,
    }


# ── Root ──────────────────────────────────────────────────────────────────────
@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "Universal AI Document Analyzer API",
        "docs": "/api/docs",
        "health": "/api/health",
    }


# ── Run directly (development) ────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="info",
    )
