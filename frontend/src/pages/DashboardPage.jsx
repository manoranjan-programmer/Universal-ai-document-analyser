import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText,
  Layers,
  Cpu,
  Sparkles,
  MessageSquare,
  Search,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  RefreshCw,
} from 'lucide-react'
import toast from 'react-hot-toast'
import StatCard from '../components/StatCard'
import UploadZone from '../components/UploadZone'
import ProcessingSteps from '../components/ProcessingSteps'
import DocumentTable from '../components/DocumentTable'
import { fetchDocuments, uploadDocument } from '../services/api'

export default function DashboardPage() {
  const navigate = useNavigate()
  const [data, setData] = useState({ documents: [], total: 0, processed: 0, failed: 0, total_chunks: 0 })
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)

  const loadData = useCallback(async () => {
    try {
      const resp = await fetchDocuments()
      setData(resp)
    } catch (err) {
      toast.error(`Failed to load data: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleUpload = async (file) => {
    setUploading(true)
    setUploadResult(null)
    const toastId = toast.loading(`Uploading & vectorizing "${file.name}"...`)

    try {
      const result = await uploadDocument(file)
      setUploadResult(result)
      if (result.success) {
        toast.success(`"${result.filename}" processed — ${result.total_chunks} chunks indexed!`, { id: toastId })
        loadData()
      } else {
        toast.error(result.error || 'Upload failed.', { id: toastId })
      }
    } catch (err) {
      toast.error(err.message, { id: toastId })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* ── Welcome & Header Banner ── */}
      <div
        className="card"
        style={{
          padding: '1.75rem 2rem',
          background: 'var(--grad-hero)',
          border: '1px solid #E0E7FF',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '1.4rem' }}>👋</span>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Universal AI Document Workspace
            </h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0, maxWidth: 600 }}>
            Intelligent document ingestion, optical character recognition (OCR), neural vector indexing, and RAG document assistance.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={loadData}
            className="btn btn-secondary"
            title="Refresh repository statistics"
            style={{ gap: '0.4rem' }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => navigate('/chat')}
            className="btn btn-primary"
            style={{ gap: '0.4rem' }}
          >
            <MessageSquare size={16} />
            <span>Launch AI Assistant</span>
          </button>
        </div>
      </div>

      {/* ── 4 Key Metric Cards ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '1.25rem',
        }}
      >
        <StatCard
          title="Indexed Documents"
          value={data.total ?? 0}
          subtitle={`${data.processed ?? 0} active in FAISS`}
          icon={FileText}
          color="primary"
          trend={{ text: 'Ready for search', positive: true }}
        />

        <StatCard
          title="Vector Chunks"
          value={data.total_chunks ?? 0}
          subtitle="Semantic passages indexed"
          icon={Layers}
          color="blue"
          trend={{ text: 'Normalized L2', positive: true }}
        />

        <StatCard
          title="Embeddings Engine"
          value="384-dim"
          subtitle="all-MiniLM-L6-v2"
          icon={Cpu}
          color="violet"
          trend={{ text: 'Transformers', positive: true }}
        />

        <StatCard
          title="RAG LLM Engine"
          value="Mistral-7B"
          subtitle="HuggingFace Inference API"
          icon={Sparkles}
          color="success"
          trend={{ text: 'Active & Online', positive: true }}
        />
      </div>

      {/* ── Document Ingestion & Pipeline Row ── */}
      <div>
        <UploadZone
          onUpload={handleUpload}
          uploading={uploading}
        />

        {uploadResult && (
          <ProcessingSteps
            steps={uploadResult.steps}
            filename={uploadResult.filename}
          />
        )}
      </div>

      {/* ── Quick Action Shortcuts ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.25rem',
        }}
      >
        <div
          className="card"
          style={{
            padding: '1.25rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
          }}
          onClick={() => navigate('/chat')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 'var(--radius-md)',
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MessageSquare size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                Ask AI Assistant
              </div>
              <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                Query your documents with cited evidence
              </div>
            </div>
          </div>
          <ArrowRight size={18} color="var(--text-light)" />
        </div>

        <div
          className="card"
          style={{
            padding: '1.25rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
          }}
          onClick={() => navigate('/search')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 'var(--radius-md)',
                background: 'var(--blue-light)',
                color: 'var(--blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Search size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                Semantic Search
              </div>
              <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                Find relevant text passages and matches
              </div>
            </div>
          </div>
          <ArrowRight size={18} color="var(--text-light)" />
        </div>
      </div>

      {/* ── Recent Documents Section ── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              Recent Documents
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              All indexed files currently stored in local FAISS repository
            </p>
          </div>

          <button
            onClick={() => navigate('/documents')}
            className="btn btn-ghost btn-sm"
            style={{ color: 'var(--primary)', fontWeight: 600 }}
          >
            <span>View All ({data.total})</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <DocumentTable
          documents={data.documents}
          onRefresh={loadData}
          showSearch={false}
        />
      </div>
    </div>
  )
}
