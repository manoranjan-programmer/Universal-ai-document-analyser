import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  FileText,
  SlidersHorizontal,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { semanticSearch, fetchDocuments } from '../services/api'

export default function SearchPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [docs, setDocs] = useState([])
  const [selectedDocId, setSelectedDocId] = useState('')
  const [topK, setTopK] = useState(5)
  const [results, setResults] = useState(null)
  const [searching, setSearching] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState(null)

  useEffect(() => {
    fetchDocuments()
      .then((data) => setDocs(data.documents || []))
      .catch(() => {})
  }, [])

  const handleSearch = async (e) => {
    if (e) e.preventDefault()
    const q = query.trim()
    if (!q) return

    setSearching(true)
    try {
      const resp = await semanticSearch(q, {
        document_id: selectedDocId || null,
        top_k: topK,
      })
      setResults(resp.results || [])
      if ((resp.results || []).length === 0) {
        toast('No matching chunks found above threshold.', { icon: 'ℹ️' })
      }
    } catch (err) {
      toast.error(`Search error: ${err.message}`)
    } finally {
      setSearching(false)
    }
  }

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(idx)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: 1000, margin: '0 auto', width: '100%' }}>
      {/* ── Header ── */}
      <div>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
          Semantic Vector Search
        </h2>
        <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: 0 }}>
          Query across document embeddings with cosine similarity powered by FAISS and all-MiniLM-L6-v2.
        </p>
      </div>

      {/* ── Search Form Card ── */}
      <form onSubmit={handleSearch} className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-light)',
              }}
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search concepts, names, skills, qualifications..."
              className="input"
              style={{ paddingLeft: '2.75rem', height: '44px', fontSize: '0.95rem' }}
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={searching || !query.trim()}
            className="btn btn-primary"
            style={{ padding: '0 1.5rem', height: '44px' }}
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Filter controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <SlidersHorizontal size={14} style={{ color: 'var(--text-muted)' }} />
            <span>Scope:</span>
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="input"
              style={{ width: 'auto', padding: '0.25rem 0.6rem', height: '32px', fontSize: '0.8rem' }}
            >
              <option value="">All Documents</option>
              {docs.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.filename}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>Top Results:</span>
            <select
              value={topK}
              onChange={(e) => setTopK(Number(e.target.value))}
              className="input"
              style={{ width: 'auto', padding: '0.25rem 0.6rem', height: '32px', fontSize: '0.8rem' }}
            >
              <option value={3}>Top 3</option>
              <option value={5}>Top 5</option>
              <option value={10}>Top 10</option>
              <option value={15}>Top 15</option>
            </select>
          </div>
        </div>
      </form>

      {/* ── Search Results List ── */}
      {results !== null && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Found {results.length} semantic matches
            </span>
          </div>

          {results.length === 0 ? (
            <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                No relevant passages found. Try a different query or adjust the similarity threshold.
              </p>
            </div>
          ) : (
            results.map((res, idx) => {
              const rawPct = Math.round((res.similarity ?? 0) * 100)
              const isHigh = rawPct >= 60

              return (
                <div key={idx} className="card animate-fade" style={{ padding: '1.25rem 1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--primary-light)',
                          color: 'var(--primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <FileText size={16} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                          {res.filename || 'Document'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Page {res.page ?? 1} · Chunk #{res.chunk_id ?? idx + 1}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span className={`badge ${isHigh ? 'badge-success' : 'badge-indigo'}`}>
                        {rawPct > 0 ? `${rawPct}% relevance` : 'Relevant match'}
                      </span>
                      <button
                        onClick={() => handleCopy(res.text, idx)}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '0.3rem 0.5rem', gap: '0.25rem' }}
                      >
                        {copiedIndex === idx ? <Check size={13} color="var(--success)" /> : <Copy size={13} />}
                        <span>{copiedIndex === idx ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Passage Text */}
                  <div
                    style={{
                      background: 'var(--bg-subtle)',
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                      fontSize: '0.85rem',
                      lineHeight: 1.6,
                      color: 'var(--text-main)',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {res.text}
                  </div>

                  {/* Action row */}
                  {res.document_id && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
                      <button
                        onClick={() => navigate(`/document/${res.document_id}`)}
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--primary)', gap: '0.35rem', fontWeight: 600 }}
                      >
                        <span>Open Document Workspace</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
