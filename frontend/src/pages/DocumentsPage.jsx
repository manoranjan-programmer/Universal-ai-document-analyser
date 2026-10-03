import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText,
  Image as ImageIcon,
  Search,
  Upload,
  Trash2,
  ArrowRight,
  RefreshCw,
  Plus,
  Clock,
  CheckCircle2,
  FileQuestion,
  Filter,
} from 'lucide-react'
import toast from 'react-hot-toast'
import DocumentUploader from '../components/DocumentUploader'
import UploadProgress from '../components/UploadProgress'
import { fetchDocuments, uploadDocument, deleteDocument } from '../services/api'

function timeAgo(dateString) {
  if (!dateString) return 'recently'
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now - date) / 1000)

  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`
  return date.toLocaleDateString()
}

function formatBytes(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function DocumentsPage() {
  const navigate = useNavigate()
  const [data, setData] = useState({ documents: [], total: 0, processed: 0, failed: 0, total_chunks: 0 })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all') // 'all', 'pdf', 'image', 'recent'
  const [showUpload, setShowUpload] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const resp = await fetchDocuments()
      setData(resp)
    } catch (err) {
      toast.error(`Failed to load documents: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleUpload = async (file) => {
    if (!file) return
    setUploading(true)
    setUploadProgress(20)
    setCurrentStep('Uploading document...')

    try {
      const p1 = setTimeout(() => {
        setUploadProgress(50)
        setCurrentStep('Extracting text & OCR...')
      }, 350)
      const p2 = setTimeout(() => {
        setUploadProgress(85)
        setCurrentStep('Understanding document & indexing...')
      }, 700)

      const result = await uploadDocument(file)

      clearTimeout(p1)
      clearTimeout(p2)
      setUploadProgress(100)

      if (result.success) {
        toast.success(`"${result.filename}" analysed successfully!`)
        setShowUpload(false)
        await loadData()
        navigate(`/?doc=${result.document_id}`)
      } else {
        toast.error(result.error || 'Upload failed')
      }
    } catch (err) {
      toast.error(err.message || 'Upload failed')
    } finally {
      setUploading(false)
      setUploadProgress(0)
      setCurrentStep('')
    }
  }

  const handleDelete = async (e, doc) => {
    e.stopPropagation()
    if (!window.confirm(`Delete "${doc.filename}" from AI memory?`)) return

    setDeletingId(doc.id)
    try {
      await deleteDocument(doc.id)
      toast.success(`"${doc.filename}" removed`)
      await loadData()
    } catch (err) {
      toast.error(err.message || 'Failed to delete')
    } finally {
      setDeletingId(null)
    }
  }

  // Filter & Search Logic
  const filteredDocs = (data.documents || []).filter((doc) => {
    const matchesSearch =
      doc.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.file_type && doc.file_type.toLowerCase().includes(searchTerm.toLowerCase()))

    if (!matchesSearch) return false

    if (filterType === 'pdf') {
      return (doc.file_type || '').toLowerCase() === 'pdf'
    }
    if (filterType === 'image') {
      const ft = (doc.file_type || '').toLowerCase()
      return ft === 'png' || ft === 'jpg' || ft === 'jpeg'
    }
    if (filterType === 'recent') {
      // Last 7 days
      if (!doc.upload_date) return true
      const diffDays = (new Date() - new Date(doc.upload_date)) / (1000 * 3600 * 24)
      return diffDays <= 7
    }

    return true
  })

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', width: '100%', padding: '1rem 0 3rem' }}>
      {/* ── Page Header ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#000000', letterSpacing: '-0.025em', margin: 0 }}>
            Recent Analyses
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem', margin: 0 }}>
            Explore indexed documents, vector chunks, and continue AI assistant conversations.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <button
            onClick={loadData}
            className="btn btn-outline btn-sm"
            style={{ gap: '0.4rem' }}
            title="Refresh repository"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setShowUpload(!showUpload)}
            className="btn btn-black btn-sm"
            style={{ gap: '0.4rem' }}
          >
            <Plus size={14} />
            <span>{showUpload ? 'Close' : 'New Upload'}</span>
          </button>
        </div>
      </div>

      {/* ── Upload Area (Collapsible) ── */}
      {showUpload && (
        <div className="card-mono animate-fade" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#000000', margin: 0 }}>
              Start a new analysis
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem', margin: 0 }}>
              Upload a document and let AI do the rest.
            </p>
          </div>

          {uploading ? (
            <UploadProgress progress={uploadProgress} currentStep={currentStep} />
          ) : (
            <DocumentUploader onUpload={handleUpload} uploading={uploading} />
          )}
        </div>
      )}

      {/* ── Search Bar & Filter Chips ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
          <Search
            size={15}
            style={{
              position: 'absolute',
              left: '0.85rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-mono"
            style={{ paddingLeft: '2.4rem', height: '38px', fontSize: '0.85rem' }}
          />
        </div>

        {/* Filter Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All' },
            { id: 'pdf', label: 'PDFs' },
            { id: 'image', label: 'Images' },
            { id: 'recent', label: 'Recent' },
          ].map((f) => {
            const active = filterType === f.id
            return (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                style={{
                  background: active ? '#000000' : '#FFFFFF',
                  color: active ? '#FFFFFF' : 'var(--text-secondary)',
                  border: `1px solid ${active ? '#000000' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-full)',
                  padding: '0.35rem 0.85rem',
                  fontSize: '0.78rem',
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
              >
                {f.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Document List / Empty State ── */}
      {filteredDocs.length === 0 ? (
        /* Strict Monochrome Empty State */
        <div
          className="card-mono"
          style={{
            padding: '4rem 2rem',
            textAlign: 'center',
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
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.25rem',
            }}
          >
            <FileQuestion size={24} color="#000000" />
          </div>

          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#000000', marginBottom: '0.35rem' }}>
            No documents yet
          </h3>

          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '380px', marginBottom: '1.75rem' }}>
            Upload your first document to start analysing with AI.
          </p>

          <button
            onClick={() => setShowUpload(true)}
            className="btn btn-black btn-lg"
            style={{ gap: '0.5rem' }}
          >
            <Upload size={16} />
            <span>Upload Document</span>
          </button>
        </div>
      ) : (
        /* Monochrome Documents Rows / Cards */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredDocs.map((doc) => {
            const isPdf = (doc.file_type || '').toLowerCase() === 'pdf'
            const isDeleting = deletingId === doc.id

            return (
              <div
                key={doc.id}
                className="card-mono"
                onClick={() => navigate(`/?doc=${doc.id}`)}
                style={{
                  padding: '1.1rem 1.4rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#000000'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                {/* Left: Icon & Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: '8px',
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {isPdf ? <FileText size={20} color="#000000" /> : <ImageIcon size={20} color="#000000" />}
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        color: '#000000',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {doc.filename}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        fontSize: '0.78rem',
                        color: 'var(--text-secondary)',
                        marginTop: '0.2rem',
                      }}
                    >
                      <span>Analyzed {timeAgo(doc.upload_date)}</span>
                      <span>·</span>
                      <span>{doc.pages || 1} {doc.pages === 1 ? 'page' : 'pages'}</span>
                      <span>·</span>
                      <span>{doc.chunks_count || 1} chunks</span>
                      <span>·</span>
                      <span>{formatBytes(doc.file_size)}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Open & Delete Actions */}
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => navigate(`/?doc=${doc.id}`)}
                    className="btn btn-black btn-sm"
                    style={{ gap: '0.35rem' }}
                  >
                    <span>Open</span>
                    <ArrowRight size={13} />
                  </button>

                  <button
                    onClick={(e) => handleDelete(e, doc)}
                    disabled={isDeleting}
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '0.4rem', color: 'var(--text-muted)' }}
                    title="Delete document"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
