/**
 * Universal AI Document Analyzer
 * API Service — all backend calls centralized here.
 */

import axios from 'axios'

// ── Axios instance ─────────────────────────────────────────────
const rawBaseUrl = import.meta.env.VITE_API_URL || ''
const normalizedBase = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl
const api = axios.create({
  baseURL: normalizedBase ? `${normalizedBase}/api` : '/api',
  timeout: 120000, // 2 min — OCR can be slow on large PDFs
  headers: { 'Content-Type': 'application/json' },
})

// ── Response interceptor for consistent error handling ─────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred'
    return Promise.reject(new Error(message))
  }
)

// ══════════════════════════════════════════════════════════════
//  Documents
// ══════════════════════════════════════════════════════════════

/**
 * Upload and process a document file.
 * @param {File} file
 * @param {Function} onProgress - optional progress callback (0–100)
 */
export const uploadDocument = async (file, onProgress) => {
  const formData = new FormData()
  formData.append('file', file)
  const response = await api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded * 100) / e.total))
      }
    },
  })
  return response.data
}

/** Fetch all documents. */
export const fetchDocuments = async () => {
  const response = await api.get('/documents')
  return response.data
}

/** Fetch a single document by ID. */
export const fetchDocument = async (id) => {
  const response = await api.get(`/documents/${id}`)
  return response.data
}

/** Delete a document. */
export const deleteDocument = async (id) => {
  const response = await api.delete(`/documents/${id}`)
  return response.data
}

/** Fetch chunks for a document. */
export const fetchDocumentChunks = async (id, limit = 20) => {
  const response = await api.get(`/documents/${id}/chunks?limit=${limit}`)
  return response.data
}

/** Fetch dashboard statistics. */
export const fetchStats = async () => {
  const response = await api.get('/documents/stats')
  return response.data
}

// ══════════════════════════════════════════════════════════════
//  Search
// ══════════════════════════════════════════════════════════════

/**
 * Semantic search over indexed chunks.
 * @param {string} query
 * @param {Object} options - { top_k, document_id }
 */
export const semanticSearch = async (query, options = {}) => {
  const response = await api.post('/search', {
    query,
    top_k: options.top_k || 5,
    document_id: options.document_id || null,
  })
  return response.data
}

// ══════════════════════════════════════════════════════════════
//  Chat / RAG
// ══════════════════════════════════════════════════════════════

/**
 * Ask a question using the RAG pipeline.
 * @param {string} question
 * @param {Object} options - { document_id, top_k, history }
 */
export const askQuestion = async (question, options = {}) => {
  const response = await api.post('/chat', {
    question,
    document_id: options.document_id || null,
    top_k: options.top_k || 5,
    history: options.history || [],
  })
  return response.data
}

// ══════════════════════════════════════════════════════════════
//  Health
// ══════════════════════════════════════════════════════════════

export const checkHealth = async () => {
  const response = await api.get('/health')
  return response.data
}

export default api
