import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, ArrowUp, X } from 'lucide-react'

const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
}

function formatBytes(bytes) {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function DocumentUploader({ onUpload, uploading = false }) {
  const [selectedFile, setSelectedFile] = useState(null)
  const [dragError, setDragError] = useState('')

  const onDrop = useCallback((accepted, rejected) => {
    setDragError('')
    if (rejected.length > 0) {
      setDragError('Supported formats: PDF, PNG, JPG, JPEG, DOCX up to 50 MB')
      return
    }
    if (accepted.length > 0) {
      setSelectedFile(accepted[0])
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: 50 * 1024 * 1024,
    multiple: false,
    noClick: false,
    disabled: uploading,
  })

  const handleUploadClick = (e) => {
    e.stopPropagation()
    if (selectedFile && onUpload) {
      onUpload(selectedFile)
    }
  }

  return (
    <div style={{ width: '100%', maxWidth: '640px', margin: '0 auto' }}>
      <div
        {...getRootProps()}
        style={{
          border: `1px dashed ${isDragActive ? '#000000' : selectedFile ? '#000000' : 'var(--border)'}`,
          background: isDragActive ? 'var(--bg-subtle)' : '#FFFFFF',
          borderRadius: 'var(--radius-xl)',
          padding: '3rem 2rem',
          textAlign: 'center',
          cursor: uploading ? 'not-allowed' : 'pointer',
          transition: 'all var(--transition-base)',
          position: 'relative',
        }}
      >
        <input {...getInputProps()} />

        {selectedFile ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '10px',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <FileText size={24} color="#000000" />
            </div>

            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#000000', marginBottom: '0.25rem' }}>
              {selectedFile.name}
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              {formatBytes(selectedFile.size)}
            </div>

            {!uploading && (
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedFile(null)
                  }}
                  className="btn btn-outline btn-sm"
                >
                  <X size={14} />
                  <span>Remove</span>
                </button>

                <button
                  type="button"
                  onClick={handleUploadClick}
                  className="btn btn-black btn-sm"
                >
                  <Upload size={14} />
                  <span>Analyse Now</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Minimal Arrow Up Icon */}
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem',
              }}
            >
              <ArrowUp size={20} color="#000000" />
            </div>

            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#000000', marginBottom: '0.35rem' }}>
              Upload your document
            </h3>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Drag & drop files here or click to browse
            </p>

            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                fontWeight: 600,
                letterSpacing: '0.04em',
                marginBottom: '1.75rem',
              }}
            >
              PDF • PNG • JPG • DOCX
            </div>

            <button
              type="button"
              className="btn btn-black btn-lg"
              disabled={uploading}
            >
              <Upload size={16} />
              <span>Upload Document</span>
            </button>
          </div>
        )}
      </div>

      {dragError && (
        <div
          style={{
            marginTop: '0.75rem',
            padding: '0.65rem 1rem',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            textAlign: 'center',
          }}
        >
          {dragError}
        </div>
      )}
    </div>
  )
}
