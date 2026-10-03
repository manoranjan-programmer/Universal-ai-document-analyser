"""
Universal AI Document Analyzer
================================
RAG (Retrieval-Augmented Generation) Pipeline.

Architecture:
    User Question
         ↓
    Question Embedding  (all-MiniLM-L6-v2)
         ↓
    FAISS Semantic Search
         ↓
    Top-K Relevant Chunks
         ↓
    Prompt Construction (context + question)
         ↓
    LLM  (Groq / OpenAI / HuggingFace)
         ↓
    Grounded Answer + Source Citations

Supported LLM providers:
    - groq        (free tier, recommended for students)
    - openai      (GPT-3.5 / GPT-4)
    - huggingface (Inference API)
    - local       (returns retrieved context directly, no LLM call)
"""

import os
import logging
from typing import List, Dict, Any, Optional

from app.config import get_settings
from app.embeddings.embedder import embed_query
from app.retrieval.faiss_store import get_vector_store
from app.models.schemas import ChatResponse, SourceChunk

logger = logging.getLogger(__name__)
settings = get_settings()

# ── System Prompt & Fallback ──────────────────────────────────────────────────
SYSTEM_PROMPT = (
    "You are an intelligent, factual document analysis assistant.\n\n"
    "CRITICAL GUIDELINES:\n"
    "1. Candidate / Document Subject Name:\n"
    "   - In resumes, profiles, and professional documents, the candidate's name is located at the top/header of the document (e.g. 'MANO RANJAN G', 'APARNA S').\n"
    "   - When asked 'what is the name?', 'candidate name', 'whose resume is this?', or 'who is this?', identify the candidate's name clearly from the top of the document.\n"
    "2. School vs College Disambiguation:\n"
    "   - 'School' refers specifically to primary / secondary / high school (10th / 12th / SSLC / HSC).\n"
    "   - 'College', 'Institute', and 'University' refer to degree/higher education (such as KPR Institute of Engineering and Technology).\n"
    "   - If the user asks for 'school', 'school name', or 'which school did he attend', and NO school name is written in the document, respond:\n"
    "     'No information available in the uploaded document regarding the school.'\n"
    "   - NEVER substitute college or university when asked about school.\n"
    "3. Grounded Factual Answering:\n"
    "   - Only state facts that are present in the provided document context.\n"
    "   - If a specific detail is not mentioned in the document, state: 'No information available in the uploaded document regarding this.'"
)

NOT_FOUND_RESPONSE = (
    "No information available in the uploaded document."
)


def extract_candidate_name(text: str) -> Optional[str]:
    """Extract candidate name from the top header of a resume/profile."""
    if not text:
        return None
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    first_segment = lines[0] if lines else text.strip()
    stop_words = [
        'Data Scientist', 'PROFILE', 'Linked In', '|', 'Email',
        'Artificial Intelligence', 'Student', 'RESUME', 'CURRICULUM',
        'SKILLS', 'EDUCATION'
    ]
    for sw in stop_words:
        if sw in first_segment:
            first_segment = first_segment.split(sw)[0].strip()
    words = first_segment.split()
    if 1 <= len(words) <= 5 and any(c.isalpha() for c in first_segment):
        return ' '.join(words)
    return None


# ══════════════════════════════════════════════════════════════════════════════
#  PROMPT BUILDER
# ══════════════════════════════════════════════════════════════════════════════

def build_prompt(question: str, context_chunks: List[Dict[str, Any]]) -> str:
    """
    Build the RAG prompt from retrieved context chunks.

    Args:
        question:       User's question.
        context_chunks: List of retrieved chunk dicts with text/source info.

    Returns:
        Prompt string containing context and question.
    """
    if not context_chunks:
        context_text = "No document sections found."
    else:
        # Sort chunks in document reading order so the text flows naturally from top to bottom
        ordered_chunks = sorted(
            context_chunks,
            key=lambda c: (c.get("page") or 0, c.get("chunk_id", 0))
        )
        parts = []
        for i, chunk in enumerate(ordered_chunks, start=1):
            source = (
                f"[Source {i}: {chunk.get('filename', 'unknown')}"
                f" | Page {chunk.get('page', 'N/A')}"
                f" | Chunk {chunk.get('chunk_id', '?')}]"
            )
            parts.append(f"{source}\n{chunk['text']}")
        context_text = "\n\n---\n\n".join(parts)

    return f"""Document Context:
{context_text}

User Question: {question}

Instructions:
1. Answer using ONLY facts explicitly present in the document context above.
2. For questions asking who the document/resume belongs to or what the candidate's name is, extract the person's name from the header/top of the document.
3. If asked specifically about school and no school name is in the text, answer: 'No information available in the uploaded document regarding the school.'
4. If other specific information is not mentioned, answer: 'No information available in the uploaded document regarding this.'

Answer:"""


def _format_messages(prompt: str, history: Optional[List[Any]] = None) -> List[Dict[str, str]]:
    """Format chat messages with system prompt, recent history, and current user prompt."""
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    if history:
        for item in history[-6:]:
            role = getattr(item, "role", None) or (item.get("role") if isinstance(item, dict) else "user")
            content = getattr(item, "content", None) or (item.get("content") if isinstance(item, dict) else "")
            if role in ("user", "assistant") and content:
                messages.append({"role": role, "content": content})
    messages.append({"role": "user", "content": prompt})
    return messages


# ══════════════════════════════════════════════════════════════════════════════
#  LLM CALLERS
# ══════════════════════════════════════════════════════════════════════════════

def _call_groq(prompt: str, history: Optional[List[Any]] = None) -> Dict[str, Any]:
    """Call Groq API with system prompt, history, and user prompt."""
    try:
        from groq import Groq
        client = Groq(api_key=settings.groq_api_key, timeout=10.0)
        messages = _format_messages(prompt, history)
        
        # Try configured model, fallback to qwen/qwen3.8-27b if unavailable
        model = settings.groq_model or "qwen/qwen3.8-27b"
        try:
            response = client.chat.completions.create(
                model=model,
                messages=messages,
                max_tokens=1024,
                temperature=0.1,
            )
            text = (response.choices[0].message.content or "").strip()
            if not text and model != "qwen/qwen3.8-27b":
                raise ValueError("Empty response from primary Groq model")
        except Exception:
            model = "qwen/qwen3.8-27b"
            response = client.chat.completions.create(
                model=model,
                messages=messages,
                max_tokens=1024,
                temperature=0.1,
            )
            text = (response.choices[0].message.content or "").strip()

        tokens = response.usage.total_tokens if response.usage else None
        return {"answer": text, "tokens": tokens, "model": model}
    except Exception as e:
        logger.error(f"Groq API call failed: {e}")
        raise RuntimeError(f"Groq LLM error: {e}")


def _call_openai(prompt: str, history: Optional[List[Any]] = None) -> Dict[str, Any]:
    """Call OpenAI Chat Completions API with system, history, and user prompt."""
    try:
        from openai import OpenAI
        client = OpenAI(api_key=settings.openai_api_key, timeout=10.0)
        messages = _format_messages(prompt, history)
        response = client.chat.completions.create(
            model=settings.openai_model,
            messages=messages,
            max_tokens=1024,
            temperature=0.1,
        )
        text = response.choices[0].message.content.strip()
        tokens = response.usage.total_tokens if response.usage else None
        return {"answer": text, "tokens": tokens, "model": settings.openai_model}
    except Exception as e:
        logger.error(f"OpenAI API call failed: {e}")
        raise RuntimeError(f"OpenAI LLM error: {e}")


def _call_huggingface(prompt: str, history: Optional[List[Any]] = None) -> Dict[str, Any]:
    """Call HuggingFace Inference API via huggingface_hub with system prompt and history."""
    try:
        from huggingface_hub import InferenceClient
        client = InferenceClient(api_key=settings.hf_api_key, timeout=12)
        messages = _format_messages(prompt, history)

        response = client.chat.completions.create(
            model=settings.hf_model,
            messages=messages,
            max_tokens=1024,
            temperature=0.1,
        )
        text = response.choices[0].message.content.strip()
        tokens = response.usage.total_tokens if response.usage else None
        return {"answer": text, "tokens": tokens, "model": settings.hf_model}
    except Exception as e:
        logger.error(f"HuggingFace API call failed: {e}")
        raise RuntimeError(f"HuggingFace LLM error: {e}")



def _call_local(prompt: str, context_chunks: List[Dict]) -> Dict[str, Any]:
    """
    Local fallback — return the retrieved context directly.
    No external LLM API needed.
    """
    if not context_chunks:
        return {
            "answer": NOT_FOUND_RESPONSE,
            "tokens": None,
            "model": "local-retrieval-only",
        }

    parts = ["Based on the retrieved document sections:\n"]
    for i, chunk in enumerate(context_chunks, start=1):
        parts.append(
            f"{i}. [{chunk.get('filename')} | "
            f"Page {chunk.get('page', 'N/A')}]\n"
            f"   {chunk['text'][:400]}..."
        )
    answer = "\n\n".join(parts)
    return {"answer": answer, "tokens": None, "model": "local-retrieval-only"}


def _call_llm(
    prompt: str,
    context_chunks: List[Dict],
    history: Optional[List[Any]] = None,
) -> Dict[str, Any]:
    """Route to the configured LLM provider."""
    provider = settings.llm_provider.lower()

    if provider == "groq":
        if not settings.groq_api_key:
            logger.warning("Groq API key not set — falling back to local mode.")
            return _call_local(prompt, context_chunks)
        try:
            return _call_groq(prompt, history=history)
        except Exception as e:
            logger.warning(f"Groq call failed ({e}), falling back to HuggingFace / local...")
            if settings.hf_api_key:
                try:
                    return _call_huggingface(prompt, history=history)
                except Exception as hfe:
                    logger.warning(f"HuggingFace fallback also failed: {hfe}")
            return _call_local(prompt, context_chunks)


    elif provider == "openai":
        if not settings.openai_api_key:
            logger.warning("OpenAI API key not set — falling back to local mode.")
            return _call_local(prompt, context_chunks)
        return _call_openai(prompt, history=history)

    elif provider == "huggingface":
        if not settings.hf_api_key:
            logger.warning("HuggingFace API key not set — falling back to local mode.")
            return _call_local(prompt, context_chunks)
        try:
            return _call_huggingface(prompt, history=history)
        except Exception as e:
            logger.warning(f"HuggingFace inference call failed ({e}), falling back to Groq...")
            if settings.groq_api_key:
                try:
                    return _call_groq(prompt, history=history)
                except Exception as ge:
                    logger.error(f"Groq fallback failed: {ge}")
            return _call_local(prompt, context_chunks)

    else:
        # "local" or any unknown provider
        return _call_local(prompt, context_chunks)


# ══════════════════════════════════════════════════════════════════════════════
#  MAIN RAG FUNCTION
# ══════════════════════════════════════════════════════════════════════════════

def run_rag_pipeline(
    question: str,
    document_id: Optional[str] = None,
    top_k: int = 5,
    history: Optional[List[Any]] = None,
) -> ChatResponse:
    """
    Run the complete RAG pipeline for a user question.

    Args:
        question:    User's question string.
        document_id: If provided, restrict search to this document.
        top_k:       Number of chunks to retrieve.
        history:     Optional list of prior chat messages for context.

    Returns:
        ChatResponse with answer, sources, and model info.
    """
    logger.info(f"RAG pipeline started | question: '{question[:80]}...' | doc_id: {document_id}")

    # Step 1: Embed question
    try:
        q_embedding = embed_query(question, model_name=settings.embedding_model)
    except Exception as e:
        logger.error(f"Query embedding failed: {e}")
        return ChatResponse(
            question=question,
            answer=f"Failed to process your question: {e}",
            sources=[],
            model_used="error",
            retrieved_chunks=0,
        )

    # Step 2: Semantic search / Document Context Gathering
    store = get_vector_store(dimension=settings.embedding_dimension)
    if store.total_chunks == 0:
        try:
            from app.services.document_service import load_registry
            load_registry()
        except Exception as e:
            logger.warning(f"Could not load registry into FAISS store: {e}")

    q_lower = question.lower()
    raw_results = []

    if document_id:
        all_doc_chunks = store.get_chunks_for_document(document_id)
        if all_doc_chunks and len(all_doc_chunks) <= 8:
            import numpy as np
            from app.embeddings.embedder import embed_texts
            try:
                c_texts = [c["text"] for c in all_doc_chunks]
                c_embs = embed_texts(c_texts)
                q_norm = np.linalg.norm(q_embedding)
                q_normed = q_embedding / (q_norm if q_norm > 0 else 1.0)

                c_norms = np.linalg.norm(c_embs, axis=1, keepdims=True)
                c_norms = np.where(c_norms == 0, 1.0, c_norms)
                c_normed = c_embs / c_norms

                sims = np.dot(c_normed, q_normed)
                indexed_results = sorted(zip(sims, all_doc_chunks), key=lambda x: x[0], reverse=True)
                for rank, (sim, chunk) in enumerate(indexed_results, start=1):
                    raw_results.append({
                        **chunk,
                        "similarity": round(float(sim), 4),
                        "rank": rank,
                    })
            except Exception as e:
                logger.warning(f"Could not rank all document chunks: {e}")
                raw_results = [
                    {**c, "similarity": 1.0, "rank": i + 1}
                    for i, c in enumerate(all_doc_chunks)
                ]
        else:
            raw_results = store.search(
                query_embedding=q_embedding,
                top_k=top_k,
                document_id=document_id,
                similarity_threshold=settings.similarity_threshold,
            )
            if not raw_results and store.total_chunks > 0:
                raw_results = store.search(
                    query_embedding=q_embedding,
                    top_k=top_k,
                    document_id=document_id,
                    similarity_threshold=0.0,
                )
            if all_doc_chunks and not any(r.get("chunk_id") == 0 for r in raw_results):
                chunk_0 = next((c for c in all_doc_chunks if c.get("chunk_id") == 0), None)
                if chunk_0:
                    raw_results.append({**chunk_0, "similarity": 0.5, "rank": len(raw_results) + 1})
    else:
        # Check if question explicitly references a specific document or candidate name
        target_doc_id = None
        for c in store.chunks_metadata:
            fname = c.get("filename", "").lower()
            stem = os.path.splitext(fname)[0].lower()
            if stem and (stem in q_lower or fname in q_lower):
                target_doc_id = c.get("document_id")
                break
            if c.get("chunk_id") == 0:
                name = extract_candidate_name(c.get("text", ""))
                if name:
                    name_parts = [p.lower() for p in name.split() if len(p) >= 3]
                    if any(part in q_lower for part in name_parts):
                        target_doc_id = c.get("document_id")
                        break

        if target_doc_id:
            # Query explicitly matches a specific document
            doc_chunks = store.get_chunks_for_document(target_doc_id)
            if doc_chunks and len(doc_chunks) <= 8:
                import numpy as np
                from app.embeddings.embedder import embed_texts
                try:
                    c_texts = [c["text"] for c in doc_chunks]
                    c_embs = embed_texts(c_texts)
                    q_norm = np.linalg.norm(q_embedding)
                    q_normed = q_embedding / (q_norm if q_norm > 0 else 1.0)
                    c_norms = np.linalg.norm(c_embs, axis=1, keepdims=True)
                    c_norms = np.where(c_norms == 0, 1.0, c_norms)
                    c_normed = c_embs / c_norms
                    sims = np.dot(c_normed, q_normed)
                    indexed_results = sorted(zip(sims, doc_chunks), key=lambda x: x[0], reverse=True)
                    for rank, (sim, chunk) in enumerate(indexed_results, start=1):
                        raw_results.append({
                            **chunk,
                            "similarity": round(float(sim), 4),
                            "rank": rank,
                        })
                except Exception:
                    raw_results = doc_chunks[:top_k]
            else:
                raw_results = store.search(
                    query_embedding=q_embedding,
                    top_k=top_k,
                    document_id=target_doc_id,
                    similarity_threshold=0.0,
                )
        else:
            # General multi-document search across all chunks
            raw_results = store.search(
                query_embedding=q_embedding,
                top_k=top_k,
                document_id=None,
                similarity_threshold=settings.similarity_threshold,
            )
            if not raw_results and store.total_chunks > 0:
                raw_results = store.search(
                    query_embedding=q_embedding,
                    top_k=top_k,
                    document_id=None,
                    similarity_threshold=0.0,
                )

            # Ensure chunk 0 (header/overview) is present for all distinct documents in the store
            all_distinct_doc_ids = list(dict.fromkeys(c["document_id"] for c in store.chunks_metadata if "document_id" in c))
            for mid in all_distinct_doc_ids:
                if not any(r.get("document_id") == mid and r.get("chunk_id") == 0 for r in raw_results):
                    chunk_0 = next((c for c in store.chunks_metadata if c.get("document_id") == mid and c.get("chunk_id") == 0), None)
                    if chunk_0:
                        raw_results.append({**chunk_0, "similarity": 0.5, "rank": len(raw_results) + 1})


    logger.info(f"  Retrieved {len(raw_results)} chunks for context.")

    # Step 3: Build source objects
    sources = [
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

    # Step 4: Build prompt
    prompt = build_prompt(question, raw_results)

    # Step 5: Call LLM
    try:
        llm_result = _call_llm(prompt, raw_results, history=history)
        answer = llm_result["answer"]
        model_used = llm_result["model"]
        tokens_used = llm_result.get("tokens")

        # ── Post-Processing Guard: Strict School vs College Disambiguation ──
        is_school_query = any(w in q_lower for w in ["school", "high school", "matriculation", "10th school", "12th school"])
        is_asking_college_too = any(w in q_lower for w in ["college", "university", "institute", "degree", "b.tech", "btech", "b.e", "be"])

        if is_school_query and not is_asking_college_too:
            doc_full_text = " ".join(r["text"] for r in raw_results).lower()
            has_school_name = any(k in doc_full_text for k in ["school name", "public school", "vidyalaya", "matriculation higher secondary", "high school name"])
            college_names = ["kpr institute", "institute of engineering", "engineering college", "university"]
            if any(c in answer.lower() for c in college_names) and not has_school_name:
                logger.info("Guard applied: Correcting school substitution with 'no information available' message.")
                answer = "No information available in the uploaded document regarding the school."

        # ── Post-Processing Guard: Candidate / Person Name ──
        is_name_query = any(k in q_lower for k in [
            "whose resume", "whose document", "whose profile", "who is this",
            "candidate name", "what is the name", "what is his name", "what is her name",
            "person name", "applicant name", "student name", "name of the candidate",
            "name of the person", "tell me the name"
        ]) or q_lower.strip() in ["name", "name?", "who is this?", "whose is this?", "who is the candidate?"]

        if is_name_query:
            # Map chunk 0 per document
            doc_chunk0_map = {}
            for r in raw_results:
                d_id = r.get("document_id")
                if r.get("chunk_id") == 0 and d_id not in doc_chunk0_map:
                    doc_chunk0_map[d_id] = r
            if not doc_chunk0_map and raw_results:
                doc_chunk0_map[raw_results[0].get("document_id")] = raw_results[0]

            extracted_names = []
            for d_id, ch0 in doc_chunk0_map.items():
                name = extract_candidate_name(ch0.get("text", ""))
                if name:
                    extracted_names.append((name, ch0.get("filename", "document")))

            if extracted_names:
                answer_lower = answer.lower()
                needs_name_correction = (
                    "no information available" in answer_lower
                    or "not mentioned" in answer_lower
                    or not any(n[0].lower().split()[0] in answer_lower for n in extracted_names)
                )
                if needs_name_correction:
                    if len(extracted_names) == 1:
                        c_name = extracted_names[0][0]
                        if "whose" in q_lower:
                            answer = f"This document/resume belongs to {c_name}."
                        else:
                            answer = f"The candidate's name is {c_name}."
                    else:
                        cand_list = ", ".join(f"{name} ({fn})" for name, fn in extracted_names)
                        answer = f"The uploaded documents belong to: {cand_list}."

    except Exception as e:
        logger.error(f"LLM call failed: {e}")
        # Graceful degradation — return retrieved context
        answer = (
            f"LLM response unavailable ({e}). "
            f"Here are the most relevant document sections:\n\n"
            + "\n\n".join(
                f"• [{r['filename']} | Page {r.get('page','N/A')}]: "
                f"{r['text'][:300]}..."
                for r in raw_results[:3]
            )
        )
        model_used = "retrieval-fallback"
        tokens_used = None

    logger.info(f"RAG pipeline complete | model: {model_used}")

    return ChatResponse(
        question=question,
        answer=answer,
        sources=sources,
        model_used=model_used,
        tokens_used=tokens_used,
        retrieved_chunks=len(sources),
    )
