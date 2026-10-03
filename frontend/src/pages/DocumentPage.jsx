import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  FileText,
  Image as ImageIcon,
  MessageSquare,
  Layers,
  FileCode,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react'
import toast from 'react-hot-toast'
import ChatInterface from '../components/ChatInterface'
import { fetchDocument, fetchDocumentChunks } from '../services/api'

function ChunkCard({ chunk, index }) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = (e) => {
    e.stopPropagation()
    navigator.clipboard.writeText(chunk.text || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className="card animate-fade"
      style={{
        padding: '1rem 1.25rem',
        cursor: 'pointer',
        transition: 'all var(--transition-fast)',
      }}
      onClick={() => setExpanded(!expanded)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <span className="badge badge-indigo">
            Chunk #{chunk.chunk_id}
          </span>
          {chunk.page && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Page {chunk.page}
            </span>
          )}
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {chunk.word_count || Math.round((chunk.text || '').split(/\s+/).length)} words
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={handleCopy}
            className="btn btn-ghost btn-sm"
            style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem', gap: '0.25rem' }}
          >
            {copied ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          {expanded ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
        </div>
      </div>

      <div
        style={{
          marginTop: '0.65rem',
          fontSize: '0.825rem',
          color: expanded ? 'var(--text-main)' : 'var(--text-secondary)',
          lineHeight: 1.6,
          background: 'var(--bg-subtle)',
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border)',
          fontFamily: expanded ? 'inherit' : 'inherit',
          whiteSpace: expanded ? 'pre-wrap' : 'normal',
          maxHeight: expanded ? 'none' : '3.6rem',
          overflow: 'hidden',
          display: expanded ? 'block' : '-webkit-box',
          WebkitLineClamp: expanded ? 'unset' : 2,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {chunk.text}
      </div>
    </div>
  )
}

function formatBytes(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function DocumentPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [doc, setDoc] = useState(null)
  const [chunks, setChunks] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('chat')
  const [chunkLimit, setChunkLimit] = useState(25)
  const [copiedFullText, setCopiedFullText] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [docData, chunksData] = await Promise.all([
          fetchDocument(id),
          fetchDocumentChunks(id, 200),
        ])
        setDoc(docData)
        setChunks(chunksData.chunks || [])
      } catch (err) {
        toast.error(err.message)
        navigate('/documents')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, navigate])

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '2rem 0' }}>
        <div className="card" style={{ height: 100, background: '#FFFFFF' }} />
        <div className="card" style={{ height: 400, background: '#FFFFFF' }} />
      </div>
    )
  }

  if (!doc) return null

  const isPdf = doc.file_type === 'pdf'

  const handleCopyAll = () => {
    navigator.clipboard.writeText(doc.extracted_text || '')
    setCopiedFullText(true)
    setTimeout(() => setCopiedFullText(false), 2000)
  }

  const TABS = [
    { key: 'chat',   icon: MessageSquare, label: 'Document Assistant' },
    { key: 'chunks', icon: Layers,         label: `Vector Chunks (${chunks.length})` },
    { key: 'text',   icon: FileCode,       label: 'Extracted Raw Text' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* ── Top Bar & Back button ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={() => navigate('/documents')}
          className="btn btn-secondary btn-sm"
          style={{ gap: '0.4rem' }}
        >
          <ArrowLeft size={14} />
          <span>Back to Documents</span>
        </button>

        <span className="badge badge-indigo">Workspace Active</span>
      </div>

      {/* ── Document Info Card ── */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 'var(--radius-md)',
                background: isPdf ? 'var(--primary-light)' : 'var(--violet-light)',
                border: `1px solid ${isPdf ? 'var(--primary-subtle)' : '#DDD6FE'}`,
                color: isPdf ? 'var(--primary)' : 'var(--violet)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {isPdf ? <FileText size={24} /> : <ImageIcon size={24} />}
            </div>

            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                {doc.filename}
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', marginTop: '0.4rem' }}>
                <span className={`badge ${doc.status === 'processed' ? 'badge-success' : 'badge-error'}`}>
                  {doc.status === 'processed' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                  <span>{doc.status}</span>
                </span>
                <span className="badge badge-neutral" style={{ textTransform: 'uppercase' }}>
                  {doc.file_type}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {formatBytes(doc.file_size)}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  · {doc.pages || 1} {doc.pages === 1 ? 'page' : 'pages'}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  · {doc.chunks_count} indexed chunks
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── View Navigation Tabs ── */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
        {TABS.map((t) => {
          const Icon = t.icon
          const isActive = activeTab === t.key
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={isActive ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
              style={{ gap: '0.4rem' }}
            >
              <Icon size={14} />
              <span>{t.label}</span>
            </button>
          )
        })}
      </div>

      {/* ── Tab Views ── */}
      {activeTab === 'chat' && (
        <div className="animate-fade">
          <ChatInterface documentId={id} />
        </div>
      )}

      {activeTab === 'chunks' && (
        <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div
            className="card"
            style={{
              padding: '1rem 1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0 }}>
              Showing <strong>{Math.min(chunkLimit, chunks.length)}</strong> of <strong>{chunks.length}</strong> vector chunks indexed for FAISS nearest-neighbor lookup.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {chunks.slice(0, chunkLimit).map((c, i) => (
              <ChunkCard key={c.chunk_id ?? i} chunk={c} index={i} />
            ))}
          </div>

          {chunkLimit < chunks.length && (
            <button
              onClick={() => setChunkLimit((prev) => prev + 25)}
              className="btn btn-secondary"
              style={{ alignSelf: 'center', marginTop: '0.5rem' }}
            >
              Load more chunks ({chunks.length - chunkLimit} remaining)
            </button>
          )}
        </div>
      )}

      {activeTab === 'text' && (
        <div className="card animate-fade" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                Cleaned & Extracted Content
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                {doc.extracted_text?.length || 0} characters
              </p>
            </div>

            <button
              onClick={handleCopyAll}
              className="btn btn-secondary btn-sm"
              style={{ gap: '0.35rem' }}
            >
              {copiedFullText ? <Check size={13} color="var(--success)" /> : <Copy size={13} />}
              <span>{copiedFullText ? 'Copied' : 'Copy All Text'}</span>
            </button>
          </div>

          <div
            style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              maxHeight: 520,
              overflowY: 'auto',
              fontFamily: 'inherit',
              fontSize: '0.85rem',
              color: 'var(--text-main)',
              lineHeight: 1.7,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {doc.extracted_text || 'No text extracted.'}
          </div>
        </div>
      )}
    </div>
  )
}
