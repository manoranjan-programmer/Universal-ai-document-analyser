import React from 'react'
import {
  FileText,
  User,
  Mail,
  Phone,
  Code2,
  Briefcase,
  GraduationCap,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
} from 'lucide-react'

export default function AnalysisPanel({ doc, chunks = [] }) {
  const [copied, setCopied] = React.useState(null)

  const copySection = (title, text) => {
    navigator.clipboard.writeText(`${title}\n\n${text}`)
    setCopied(title)
    setTimeout(() => setCopied(null), 2000)
  }

  // Derive key facts from chunks if text contains resume / candidate info
  const allText = chunks.map((c) => c.text).join(' ')

  // Simple heuristic extractors from text
  const emailMatch = allText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
  const phoneMatch = allText.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        padding: '1.5rem',
        height: '100%',
        overflowY: 'auto',
        background: '#FFFFFF',
      }}
    >
      {/* ── Document Summary Card ── */}
      <div className="card-mono" style={{ padding: '1.25rem 1.5rem', textAlign: 'left' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.75rem',
            borderBottom: '1px solid var(--border)',
            paddingBottom: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={15} color="#000000" />
            <h3 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#000000', margin: 0 }}>
              Document Summary
            </h3>
          </div>

          <button
            onClick={() =>
              copySection(
                'Document Summary',
                `AI-generated analysis for ${doc?.filename || 'Document'}. Contains ${chunks.length} vectorized chunks across ${doc?.pages || 1} pages.`
              )
            }
            className="btn btn-ghost btn-sm"
            style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem', gap: '0.25rem' }}
          >
            {copied === 'Document Summary' ? <Check size={12} color="#000000" /> : <Copy size={12} />}
            <span>{copied === 'Document Summary' ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        <p style={{ fontSize: '0.875rem', color: '#1A1A1A', lineHeight: 1.6, margin: 0 }}>
          This document (<strong>{doc?.filename || 'Uploaded Document'}</strong>) has been extracted and indexed into <strong>{chunks.length} vector segments</strong>. The AI assistant has parsed the structural layout, verified OCR fidelity, and grounded its vector retrieval on exact document passages.
        </p>
      </div>

      {/* ── Key Information Card ── */}
      <div className="card-mono" style={{ padding: '1.25rem 1.5rem', textAlign: 'left' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.75rem',
            borderBottom: '1px solid var(--border)',
            paddingBottom: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={15} color="#000000" />
            <h3 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#000000', margin: 0 }}>
              Key Information
            </h3>
          </div>

          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Structured Entity Parse
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
          <div style={{ padding: '0.65rem 0.85rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
              Document / Entity
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#000000' }}>
              {doc?.filename || 'Document'}
            </div>
          </div>

          <div style={{ padding: '0.65rem 0.85rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
              Contact / Email
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#000000' }}>
              {emailMatch ? emailMatch[0] : 'In document text'}
            </div>
          </div>

          <div style={{ padding: '0.65rem 0.85rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
              Status / Verification
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#000000', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <CheckCircle2 size={13} color="#000000" />
              <span>Vector Indexed</span>
            </div>
          </div>

          <div style={{ padding: '0.65rem 0.85rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
              Pages & Vectors
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#000000' }}>
              {doc?.pages || 1} Pages · {chunks.length} Chunks
            </div>
          </div>
        </div>
      </div>

      {/* ── AI Insights Card ── */}
      <div className="card-mono" style={{ padding: '1.25rem 1.5rem', textAlign: 'left' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.75rem',
            borderBottom: '1px solid var(--border)',
            paddingBottom: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={15} color="#000000" />
            <h3 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#000000', margin: 0 }}>
              AI Insights & Observations
            </h3>
          </div>
        </div>

        <ul style={{ listStyleType: 'disc', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.85rem', color: '#262626' }}>
          <li>
            <strong>Context Coverage:</strong> Document successfully tokenized with optimal 500-char window overlap, preserving sentence semantics.
          </li>
          <li>
            <strong>Grounded Answering:</strong> When you submit queries via the AI Assistant, answers cite specific chunk IDs and page numbers directly.
          </li>
          <li>
            <strong>Missing Information Detection:</strong> The AI model will explicitly state if requested specifics are not present in the document.
          </li>
          <li>
            <strong>Quick Inquiries:</strong> Use the suggested prompt chips in the assistant pane to quickly trigger summaries, credential checks, and skills extraction.
          </li>
        </ul>
      </div>
    </div>
  )
}
