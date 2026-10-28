import React, { useState, useEffect } from 'react'
import {
  Server,
  Sparkles,
  Sliders,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Layers,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { checkHealth } from '../services/api'

export default function SettingsPage() {
  const [healthStatus, setHealthStatus] = useState(null)
  const [testingHealth, setTestingHealth] = useState(false)

  const testHealth = async () => {
    setTestingHealth(true)
    try {
      const resp = await checkHealth()
      setHealthStatus({ online: true, details: resp, time: new Date().toLocaleTimeString() })
      toast.success('AI Backend server is online and operational')
    } catch (err) {
      setHealthStatus({ online: false, error: err.message, time: new Date().toLocaleTimeString() })
      toast.error(`Health check failed: ${err.message}`)
    } finally {
      setTestingHealth(false)
    }
  }

  useEffect(() => {
    testHealth()
  }, [])

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto', width: '100%', padding: '1rem 0 3rem' }}>
      {/* ── Page Header ── */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#000000', letterSpacing: '-0.025em', margin: 0 }}>
          Settings & Architecture
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem', margin: 0 }}>
          Inference providers, neural embedding models, and vector database configuration.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* ── Backend Engine Health Status ── */}
        <div className="card-mono" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '8px',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border)',
                  color: '#000000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Server size={18} />
              </div>

              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: '#000000' }}>
                  FastAPI Backend Server
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
                  REST API & FAISS vector search pipeline running on port 8000
                </p>
              </div>
            </div>

            <button
              onClick={testHealth}
              disabled={testingHealth}
              className="btn btn-outline btn-sm"
              style={{ gap: '0.4rem' }}
            >
              <RefreshCw size={13} className={testingHealth ? 'animate-spin' : ''} />
              <span>Test Connection</span>
            </button>
          </div>

          <div
            style={{
              padding: '0.9rem 1.1rem',
              background: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: healthStatus?.online ? '#000000' : '#999999',
                  display: 'inline-block',
                }}
              />
              <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#000000' }}>
                Status: {healthStatus?.online ? 'Connected & Operational' : 'Checking status...'}
              </span>
            </div>

            {healthStatus?.time && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Checked at {healthStatus.time}
              </span>
            )}
          </div>
        </div>

        {/* ── AI Provider & Models ── */}
        <div className="card-mono" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Sparkles size={16} color="#000000" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: '#000000', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Model Specifications
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* HuggingFace Card */}
            <div
              style={{
                padding: '1rem 1.25rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                background: '#FFFFFF',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#000000' }}>
                  Large Language Model (LLM)
                </span>
                <span className="badge-mono">Active</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 0.4rem 0' }}>
                Provider: <strong style={{ color: '#000000' }}>Hugging Face Inference API</strong> · Model: <code style={{ background: 'var(--bg-subtle)', padding: '0.1rem 0.35rem', borderRadius: 4 }}>mistralai/Mistral-7B-Instruct-v0.1</code>
              </p>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Context-grounded answering system configured to reply based on extracted document chunks with source page citations.
              </div>
            </div>

            {/* Embeddings Card */}
            <div
              style={{
                padding: '1rem 1.25rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                background: '#FFFFFF',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#000000' }}>
                  Neural Text Embeddings
                </span>
                <span className="badge-mono">Local / HF</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 0.4rem 0' }}>
                Model: <code style={{ background: 'var(--bg-subtle)', padding: '0.1rem 0.35rem', borderRadius: 4 }}>sentence-transformers/all-MiniLM-L6-v2</code>
              </p>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Generates 384-dimensional dense semantic representations for sub-millisecond similarity matching in FAISS.
              </div>
            </div>
          </div>
        </div>

        {/* ── Vector & Chunking Parameters ── */}
        <div className="card-mono" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Sliders size={16} color="#000000" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: '#000000', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              RAG Pipeline Configuration
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
            <div style={{ padding: '0.85rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>
                Chunk Size
              </span>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#000000', marginTop: '0.2rem' }}>
                500 chars
              </div>
            </div>

            <div style={{ padding: '0.85rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>
                Chunk Overlap
              </span>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#000000', marginTop: '0.2rem' }}>
                50 chars
              </div>
            </div>

            <div style={{ padding: '0.85rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>
                Top-K Retrieval
              </span>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#000000', marginTop: '0.2rem' }}>
                5 segments
              </div>
            </div>

            <div style={{ padding: '0.85rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>
                Vector Index
              </span>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#000000', marginTop: '0.2rem' }}>
                FAISS FlatL2
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
