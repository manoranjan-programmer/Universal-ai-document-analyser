import React from 'react'
import {
  Scan,
  Scissors,
  Cpu,
  Database,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react'

const STEP_CONFIG = {
  ocr:       { icon: Scan,     label: 'Text & OCR Extraction' },
  chunking:  { icon: Scissors, label: 'Document Chunking' },
  embedding: { icon: Cpu,      label: 'Vector Embeddings (MiniLM-L6)' },
  indexing:  { icon: Database, label: 'FAISS Index Integration' },
}

export default function ProcessingSteps({ steps = [], filename = '' }) {
  if (!steps || steps.length === 0) return null

  const allDone = steps.every((s) => s.status === 'success')
  const hasFailed = steps.some((s) => s.status === 'error')

  return (
    <div className="card animate-fade" style={{ marginTop: '1.5rem', padding: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
            Ingestion Pipeline Status
          </h3>
          {filename && (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem', margin: 0 }}>
              Processing: <strong style={{ color: 'var(--text-main)' }}>{filename}</strong>
            </p>
          )}
        </div>

        {allDone && (
          <span className="badge badge-success">
            <CheckCircle2 size={13} />
            <span>Ready for Analysis</span>
          </span>
        )}
        {hasFailed && (
          <span className="badge badge-error">
            <AlertCircle size={13} />
            <span>Failed</span>
          </span>
        )}
      </div>

      {/* Step List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {steps.map((step, i) => {
          const cfg = STEP_CONFIG[step.step] || { icon: Cpu, label: step.step }
          const Icon = cfg.icon
          const isSuccess = step.status === 'success'
          const isError = step.status === 'error'

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '0.85rem 1rem',
                background: isSuccess ? 'var(--success-light)' : isError ? 'var(--error-light)' : 'var(--bg-subtle)',
                border: `1px solid ${isSuccess ? 'var(--success-border)' : isError ? 'var(--error-border)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-md)',
                transition: 'all var(--transition-base)',
              }}
            >
              {/* Step Icon */}
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 'var(--radius-sm)',
                  background: '#FFFFFF',
                  border: '1px solid var(--border)',
                  color: isSuccess ? 'var(--success)' : isError ? 'var(--error)' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon size={18} />
              </div>

              {/* Text info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)' }}>
                    {cfg.label}
                  </span>
                  <span
                    className={`badge ${isSuccess ? 'badge-success' : isError ? 'badge-error' : 'badge-neutral'}`}
                    style={{ fontSize: '0.65rem' }}
                  >
                    {step.status}
                  </span>
                </div>
                {step.message && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                    {step.message}
                  </p>
                )}
              </div>

              {/* Status indicator icon */}
              <div>
                {isSuccess && <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />}
                {isError && <AlertCircle size={18} style={{ color: 'var(--error)' }} />}
                {!isSuccess && !isError && <Clock size={18} style={{ color: 'var(--text-light)' }} />}
              </div>
            </div>
          )
        })}
      </div>

      {/* Completion Banner */}
      {allDone && (
        <div
          style={{
            marginTop: '1.25rem',
            padding: '0.9rem 1.15rem',
            background: 'var(--primary-light)',
            border: '1px solid var(--primary-subtle)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Sparkles size={18} style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>
              Document vectorized & ready in FAISS memory! You can query it in the AI Chatbot now.
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
