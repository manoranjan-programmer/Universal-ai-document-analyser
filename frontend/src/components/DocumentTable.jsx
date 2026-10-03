import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText,
  Image as ImageIcon,
  MessageSquare,
  Eye,
  Trash2,
  Calendar,
  Layers,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  HardDrive,
} from 'lucide-react'
import { deleteDocument } from '../services/api'
import toast from 'react-hot-toast'

const STATUS_BADGE = {
  processed:  { cls: 'badge-success', label: 'Processed', icon: CheckCircle2 },
  failed:     { cls: 'badge-error',   label: 'Failed',    icon: AlertCircle },
  processing: { cls: 'badge-warning', label: 'Indexing',  icon: Clock },
  pending:    { cls: 'badge-neutral', label: 'Pending',   icon: Clock },
}

function formatDate(isoString) {
  if (!isoString) return '—'
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatBytes(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function DocumentTable({ documents = [], onRefresh, showSearch = true }) {
  const navigate = useNavigate()
  const [deleting, setDeleting] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredDocs = documents.filter((doc) =>
    doc.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doc.file_type && doc.file_type.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleDelete = async (doc) => {
    if (!window.confirm(`Delete "${doc.filename}"? This will remove its embeddings from FAISS.`)) return
    setDeleting(doc.id)
    try {
      await deleteDocument(doc.id)
      toast.success(`"${doc.filename}" removed.`)
      onRefresh?.()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setDeleting(null)
    }
  }

  if (documents.length === 0) {
    return (
      <div
        className="card"
        style={{
          textAlign: 'center',
          padding: '3.5rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'var(--bg-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-light)',
            marginBottom: '1rem',
          }}
        >
          <HardDrive size={28} />
        </div>
        <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
          No documents uploaded yet
        </h4>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: 400, margin: 0 }}>
          Upload a PDF or image document using the ingestion area to extract text and start querying with AI.
        </p>
      </div>
    )
  }

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      {showSearch && (
        <div
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            background: '#FFFFFF',
          }}
        >
          <div style={{ position: 'relative', maxWidth: '320px', width: '100%' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '0.85rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-light)',
              }}
            />
            <input
              type="text"
              placeholder="Filter documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
              style={{ paddingLeft: '2.35rem', fontSize: '0.825rem', height: '36px' }}
            />
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Showing <strong>{filteredDocs.length}</strong> of <strong>{documents.length}</strong> documents
          </div>
        </div>
      )}

      {/* Table Container */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
          <thead>
            <tr
              style={{
                borderBottom: '1px solid var(--border)',
                background: 'var(--bg-subtle)',
                fontSize: '0.725rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              <th style={{ padding: '0.85rem 1.25rem' }}>Document Name</th>
              <th style={{ padding: '0.85rem 1rem' }}>Type</th>
              <th style={{ padding: '0.85rem 1rem' }}>Status</th>
              <th style={{ padding: '0.85rem 1rem' }}>Vectors / Chunks</th>
              <th style={{ padding: '0.85rem 1rem' }}>Uploaded</th>
              <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocs.map((doc) => {
              const statusCfg = STATUS_BADGE[doc.status] || STATUS_BADGE.pending
              const StatusIcon = statusCfg.icon
              const isPdf = doc.file_type === 'pdf'

              return (
                <tr
                  key={doc.id}
                  style={{
                    borderBottom: '1px solid var(--border)',
                    transition: 'background var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Filename & size */}
                  <td style={{ padding: '0.9rem 1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 'var(--radius-sm)',
                          background: isPdf ? 'var(--primary-light)' : 'var(--violet-light)',
                          border: `1px solid ${isPdf ? 'var(--primary-subtle)' : '#DDD6FE'}`,
                          color: isPdf ? 'var(--primary)' : 'var(--violet)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {isPdf ? <FileText size={18} /> : <ImageIcon size={18} />}
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            color: 'var(--text-main)',
                            maxWidth: '280px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {doc.filename}
                        </div>
                        <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                          {formatBytes(doc.file_size)} · {doc.pages || 1} {doc.pages === 1 ? 'page' : 'pages'}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* File Type */}
                  <td style={{ padding: '0.9rem 1rem' }}>
                    <span className="badge badge-neutral" style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
                      {doc.file_type}
                    </span>
                  </td>

                  {/* Status */}
                  <td style={{ padding: '0.9rem 1rem' }}>
                    <span className={`badge ${statusCfg.cls}`}>
                      <StatusIcon size={12} />
                      <span>{statusCfg.label}</span>
                    </span>
                  </td>

                  {/* Chunks */}
                  <td style={{ padding: '0.9rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Layers size={14} style={{ color: 'var(--text-light)' }} />
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                        {doc.chunks_count ?? 0}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>chunks</span>
                    </div>
                  </td>

                  {/* Upload Date */}
                  <td style={{ padding: '0.9rem 1rem', fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
                    {formatDate(doc.upload_date)}
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '0.9rem 1.25rem', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                      {doc.status === 'processed' && (
                        <>
                          <button
                            onClick={() => navigate(`/chat?doc=${doc.id}`)}
                            className="btn btn-secondary btn-sm"
                            title="Chat with this document"
                            style={{ gap: '0.35rem' }}
                          >
                            <MessageSquare size={14} style={{ color: 'var(--primary)' }} />
                            <span>Chat</span>
                          </button>

                          <button
                            onClick={() => navigate(`/document/${doc.id}`)}
                            className="btn btn-secondary btn-sm"
                            title="View document chunks & insights"
                            style={{ padding: '0.35rem 0.5rem' }}
                          >
                            <Eye size={14} />
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => handleDelete(doc)}
                        disabled={deleting === doc.id}
                        className="btn btn-danger btn-sm"
                        title="Delete document"
                        style={{ padding: '0.35rem 0.5rem' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
