import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  Shield,
  Layers,
} from 'lucide-react'

const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
}

function formatBytes(bytes) {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function UploadZone({ onUpload, uploading = false, uploadProgress = null }) {
  const [selectedFile, setSelectedFile] = useState(null)
  const [dragError, setDragError] = useState('')

  const onDrop = useCallback((accepted, rejected) => {
    setDragError('')
    if (rejected.length > 0) {
      const err = rejected[0].errors?.[0]?.message || 'File not supported'
      setDragError(err)
      return
    }
    if (accepted.length > 0) {
      setSelectedFile(accepted[0])
      setDragError('')
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: 50 * 1024 * 1024,
    multiple: false,
    disabled: uploading,
  })

  const ext = selectedFile ? selectedFile.name.split('.').pop().toLowerCase() : null
  const isImage = ext === 'png' || ext === 'jpg' || ext === 'jpeg'

  const handleUpload = () => {
    if (selectedFile && onUpload) {
      onUpload(selectedFile)
    }
  }

  const handleRemove = (e) => {
    e.stopPropagation()
    setSelectedFile(null)
    setDragError('')
  }

  return (
    <div className="card" style={{ padding: '1.75rem' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
          Document Ingestion & AI Pipeline
        </h3>
        <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
          Upload PDF documents or scanned images to automatically extract text, generate vector embeddings, and index into FAISS.
        </p>
      </div>

      {/* Drop Area */}
      <div
        {...getRootProps()}
        id="upload-dropzone"
        style={{
          border: `2px dashed ${
            isDragActive
              ? 'var(--primary)'
              : selectedFile
              ? 'var(--success)'
              : 'var(--border)'
          }`,
          borderRadius: 'var(--radius-lg)',
          padding: '2.5rem 1.5rem',
          textAlign: 'center',
          cursor: uploading ? 'not-allowed' : 'pointer',
          background: isDragActive
            ? 'var(--primary-light)'
            : selectedFile
            ? 'var(--success-light)'
            : 'var(--bg-subtle)',
          transition: 'all var(--transition-base)',
        }}
      >
        <input {...getInputProps()} id="file-input" />

        {selectedFile ? (
          <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: 'var(--radius-md)',
                background: '#FFFFFF',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isImage ? 'var(--violet)' : 'var(--primary)',
                marginBottom: '1rem',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              {isImage ? <ImageIcon size={30} /> : <FileText size={30} />}
            </div>

            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
              {selectedFile.name}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <span className="badge badge-indigo" style={{ textTransform: 'uppercase' }}>
                {ext}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {formatBytes(selectedFile.size)}
              </span>
            </div>

            {!uploading && (
              <button
                type="button"
                onClick={handleRemove}
                className="btn btn-ghost btn-sm"
                style={{ color: 'var(--error)', gap: '0.35rem' }}
              >
                <X size={15} />
                <span>Remove file</span>
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: isDragActive ? 'var(--primary-subtle)' : '#FFFFFF',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
                marginBottom: '1rem',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all var(--transition-base)',
                transform: isDragActive ? 'scale(1.08)' : 'scale(1)',
              }}
            >
              <UploadCloud size={30} />
            </div>

            <p style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
              {isDragActive ? 'Drop your document right here' : 'Click to browse or drag & drop files here'}
            </p>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Supports PDF documents, scanned forms, PNG, and JPG images up to 50 MB
            </p>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <span className="badge badge-indigo">PDF</span>
              <span className="badge badge-neutral">PNG</span>
              <span className="badge badge-neutral">JPG / JPEG</span>
              <span className="badge badge-neutral">OCR Active</span>
            </div>
          </div>
        )}
      </div>

      {/* Drag error */}
      {dragError && (
        <div
          style={{
            marginTop: '0.85rem',
            padding: '0.75rem 1rem',
            background: 'var(--error-light)',
            border: '1px solid var(--error-border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--error)',
            fontSize: '0.825rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <AlertCircle size={16} />
          <span>{dragError}</span>
        </div>
      )}

      {/* Upload Progress Bar if uploading */}
      {uploading && uploadProgress !== null && (
        <div style={{ marginTop: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
            <span>Processing document…</span>
            <span>{uploadProgress}%</span>
          </div>
          <div style={{ height: 6, background: 'var(--bg-subtle)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                background: 'var(--grad-primary)',
                width: `${uploadProgress}%`,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>
      )}

      {/* Action CTA */}
      {selectedFile && !uploading && (
        <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={handleRemove}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            id="upload-btn"
            type="button"
            onClick={handleUpload}
            className="btn btn-primary"
            style={{ padding: '0.65rem 1.4rem' }}
          >
            <span>Upload & Ingest</span>
            <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
