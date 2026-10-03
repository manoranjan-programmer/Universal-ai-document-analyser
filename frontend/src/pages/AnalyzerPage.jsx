import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import UploadZone from '../components/UploadZone'
import ProcessingSteps from '../components/ProcessingSteps'
import ChatInterface from '../components/ChatInterface'
import { uploadDocument } from '../services/api'

/* ── Hero background animated orbs ─────────────────────────────── */
function HeroOrb({ style }) {
  return (
    <div style={{
      position: 'absolute',
      borderRadius: '50%',
      filter: 'blur(80px)',
      opacity: 0.18,
      pointerEvents: 'none',
      ...style,
    }} />
  )
}

/* ── Section label ──────────────────────────────────────────────── */
function SectionLabel({ number, text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
      <div style={{
        width: 28, height: 28,
        background: 'var(--grad-primary)',
        borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.75rem', fontWeight: 700, color: '#fff', flexShrink: 0,
      }}>
        {number}
      </div>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{text}</h2>
    </div>
  )
}

export default function AnalyzerPage() {
  const navigate = useNavigate()
  const [uploading, setUploading] = useState(false)
  const [result, setResult]       = useState(null)   // processing result
  const [docId, setDocId]         = useState(null)   // current document id
  const [tab, setTab]             = useState('text') // 'text' | 'chunks'

  /* ── Upload handler ─────────────────────────────────────────── */
  const handleUpload = async (file) => {
    setUploading(true)
    setResult(null)
    setDocId(null)

    const toastId = toast.loading(`Processing "${file.name}"…`)

    try {
      const data = await uploadDocument(file)
      setResult(data)

      if (data.success) {
        setDocId(data.document_id)
        toast.success(`"${data.filename}" processed — ${data.total_chunks} chunks indexed!`, { id: toastId })
      } else {
        toast.error(data.error || 'Processing failed.', { id: toastId })
      }
    } catch (err) {
      toast.error(err.message, { id: toastId })
    } finally {
      setUploading(false)
    }
  }

  const extractedText = result?.extracted_text || ''
  const truncatedText = extractedText.slice(0, 3000) + (extractedText.length > 3000 ? '\n\n[… truncated for display …]' : '')

  return (
    <div className="page dot-grid" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Ambient orbs */}
      <HeroOrb style={{ width: 500, height: 500, background: '#6c63ff', top: -100, left: -150 }} />
      <HeroOrb style={{ width: 400, height: 400, background: '#a78bfa', top: 100, right: -100 }} />

      <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem', position: 'relative' }}>

        {/* ── Hero Header ──────────────────────────────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.35rem 1rem',
            background: 'var(--accent-glow-soft)',
            border: '1px solid var(--border-accent)',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.78rem', fontWeight: 600,
            color: 'var(--accent-secondary)',
            marginBottom: '1.25rem',
          }}>
            🧠 Deep Learning · OCR · Transformers · FAISS · RAG
          </div>

          <h1 style={{ marginBottom: '1rem', letterSpacing: '-0.02em' }}>
            <span className="gradient-text">Universal AI</span>
            <br />Document Analyzer
          </h1>

          <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', maxWidth: 560, margin: '0 auto' }}>
            Upload any document. Extract, understand, and ask questions using
            semantic search and retrieval-augmented generation.
          </p>

          {/* Architecture pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
            {['EasyOCR', 'all-MiniLM-L6-v2', 'FAISS', 'RAG', 'FastAPI', 'React'].map((t) => (
              <span key={t} className="badge badge-purple">{t}</span>
            ))}
          </div>
        </div>

        {/* ── Main Grid ─────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>

          {/* ── Left Column ─────────────────────────────────────────── */}
          <div>
            {/* Step 1 — Upload */}
            <div className="glass-card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
              <SectionLabel number="1" text="Upload Document" />
              <UploadZone onUpload={handleUpload} uploading={uploading} />
            </div>

            {/* Step 2 — Processing Pipeline */}
            {result && (
              <div className="glass-card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
                <SectionLabel number="2" text="Processing Status" />
                <ProcessingSteps steps={result.steps} filename={result.filename} />

                {/* Stats */}
                {result.success && (
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr',
                    gap: '0.75rem', marginTop: '1rem',
                  }}>
                    {[
                      { label: 'Pages',  value: result.total_pages },
                      { label: 'Chunks', value: result.total_chunks },
                    ].map(({ label, value }) => (
                      <div key={label} style={{
                        padding: '0.875rem',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        textAlign: 'center',
                      }}>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-primary)', lineHeight: 1 }}>
                          {value}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                          {label}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 3 — Extracted text */}
            {result?.success && extractedText && (
              <div className="glass-card" style={{ padding: '1.75rem' }}>
                {/* Tabs */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  {['text', 'chunks'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={`btn btn-sm ${tab === t ? 'btn-primary' : 'btn-ghost'}`}
                    >
                      {t === 'text' ? '📝 Extracted Text' : '🔷 Chunks Preview'}
                    </button>
                  ))}
                </div>

                {tab === 'text' ? (
                  <div style={{
                    background: 'var(--bg-base)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                    maxHeight: 320,
                    overflowY: 'auto',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.78rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.7,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}>
                    {truncatedText || 'No text extracted.'}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    <p style={{ marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
                      {result.total_chunks} chunks created from this document.
                      Each chunk is 300 words with 50-word overlap.
                    </p>
                    <button
                      onClick={() => navigate(`/document/${docId}`)}
                      className="btn btn-secondary btn-sm"
                    >
                      View all chunks →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Right Column — Chat ──────────────────────────────────── */}
          <div>
            <div className="glass-card" style={{ overflow: 'hidden' }}>
              <SectionLabel number="3" text="Ask Your Document" />
              <div style={{
                margin: '-1.75rem',
                marginTop: 0,
                height: 640,
                borderTop: '1px solid var(--border)',
                display: 'flex', flexDirection: 'column',
              }}>
                {!docId ? (
                  <div style={{
                    flex: 1, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-muted)', gap: '1rem',
                  }}>
                    <div style={{ fontSize: '3.5rem', animation: 'float 3s ease-in-out infinite' }}>💬</div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                        Upload a document to start chatting
                      </p>
                      <p style={{ fontSize: '0.82rem' }}>
                        The AI will answer questions based on your document content.
                      </p>
                    </div>
                  </div>
                ) : (
                  <ChatInterface documentId={docId} />
                )}
              </div>
            </div>

            {/* Navigate to dashboard */}
            {docId && (
              <button
                onClick={() => navigate('/dashboard')}
                className="btn btn-secondary w-full"
                style={{ marginTop: '1rem' }}
              >
                📊 View Dashboard
              </button>
            )}
          </div>
        </div>

        {/* ── Architecture section ────────────────────────────────── */}
        <div style={{ marginTop: '4rem', textAlign: 'center' }}>
          <h2 style={{ marginBottom: '0.5rem' }}>System Architecture</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
            End-to-end AI pipeline from raw document to intelligent answers
          </p>
          <div style={{
            display: 'flex', flexWrap: 'wrap',
            justifyContent: 'center', alignItems: 'center',
            gap: '0',
          }}>
            {[
              { label: 'Document Input', icon: '📄', sub: 'PDF / JPG / PNG' },
              { label: 'OCR', icon: '🔍', sub: 'EasyOCR' },
              { label: 'Chunking', icon: '✂️', sub: '300 words / 50 overlap' },
              { label: 'Embeddings', icon: '🧠', sub: 'all-MiniLM-L6-v2' },
              { label: 'FAISS Index', icon: '📦', sub: 'Vector search' },
              { label: 'RAG + LLM', icon: '⚡', sub: 'Grounded answers' },
            ].map((step, i, arr) => (
              <React.Fragment key={i}>
                <div style={{
                  padding: '1rem 1.25rem',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-accent)',
                  borderRadius: 'var(--radius-lg)',
                  textAlign: 'center',
                  minWidth: 120,
                }}>
                  <div style={{ fontSize: '1.75rem', marginBottom: '0.3rem' }}>{step.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)' }}>{step.label}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{step.sub}</div>
                </div>
                {i < arr.length - 1 && (
                  <div style={{ color: 'var(--accent-primary)', fontSize: '1.2rem', padding: '0 0.25rem' }}>→</div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
