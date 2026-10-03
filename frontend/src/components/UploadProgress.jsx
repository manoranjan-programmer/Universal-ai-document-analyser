import React from 'react'
import { Sparkles, FileText, CheckCircle2, Loader2 } from 'lucide-react'

export default function UploadProgress({ progress = 0, currentStep = 'Uploading document...', filename = '' }) {
  const steps = [
    'Uploading document...',
    'Extracting text & OCR...',
    'Understanding document structure...',
    'Generating vector embeddings & AI insights...',
  ]

  return (
    <div
      className="card-mono animate-fade"
      style={{
        padding: '1.75rem',
        maxWidth: 580,
        margin: '1.5rem auto 0',
        textAlign: 'left',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Loader2 size={18} className="animate-spin" color="#000000" />
          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#000000' }}>
            {currentStep}
          </span>
        </div>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#666666' }}>
          {progress}%
        </span>
      </div>

      {filename && (
        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          File: <strong style={{ color: '#000000' }}>{filename}</strong>
        </div>
      )}

      {/* Progress Bar */}
      <div
        style={{
          height: 6,
          background: 'var(--bg-subtle)',
          borderRadius: 'var(--radius-full)',
          overflow: 'hidden',
          marginBottom: '1.25rem',
        }}
      >
        <div
          style={{
            height: '100%',
            background: '#000000',
            width: `${Math.max(progress, 15)}%`,
            transition: 'width 0.25s ease',
          }}
        />
      </div>

      {/* Step checklist */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
        {steps.map((st, i) => {
          const isDone = progress >= (i + 1) * 25
          const isCurrent = !isDone && progress >= i * 25
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: isDone ? '#000000' : isCurrent ? '#000000' : 'var(--text-muted)',
                fontWeight: isCurrent ? 600 : 400,
              }}
            >
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: isDone ? '#000000' : 'transparent',
                  border: isDone ? 'none' : '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  fontSize: '0.55rem',
                }}
              >
                {isDone ? '✓' : ''}
              </div>
              <span>{st}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
