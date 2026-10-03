import React from 'react'
import DocumentUploader from './DocumentUploader'
import UploadProgress from './UploadProgress'
import { Sparkles, FileText, ArrowRight } from 'lucide-react'

export default function AIWelcome({
  onUpload,
  uploading = false,
  uploadProgress = 0,
  currentStep = '',
  recentDocs = [],
  onSelectDoc,
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1.5rem',
        maxWidth: '800px',
        margin: '0 auto',
        width: '100%',
        textAlign: 'center',
      }}
      className="animate-fade"
    >
      {/* Small Badge */}
      <div
        className="badge-mono"
        style={{ marginBottom: '1.25rem' }}
      >
        <Sparkles size={12} color="#000000" />
        <span>AI Document Intelligence</span>
      </div>

      {/* Large Heading */}
      <h1
        style={{
          fontSize: 'clamp(2rem, 4vw, 2.75rem)',
          fontWeight: 800,
          color: '#000000',
          letterSpacing: '-0.03em',
          marginBottom: '0.75rem',
          maxWidth: '650px',
        }}
      >
        How can I help with your document?
      </h1>

      {/* Supporting Text */}
      <p
        style={{
          fontSize: '1rem',
          color: 'var(--text-secondary)',
          maxWidth: '540px',
          marginBottom: '2.5rem',
          lineHeight: 1.6,
        }}
      >
        Upload a document and let AI extract, understand and analyse the information for you.
      </p>

      {/* Upload Zone or Progress */}
      {uploading ? (
        <UploadProgress progress={uploadProgress} currentStep={currentStep} />
      ) : (
        <DocumentUploader onUpload={onUpload} uploading={uploading} />
      )}

      {/* Existing documents quick pick */}
      {!uploading && recentDocs.length > 0 && (
        <div style={{ marginTop: '3rem', width: '100%', maxWidth: '640px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.75rem',
              padding: '0 0.5rem',
            }}
          >
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Or continue with a recent document
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
            {recentDocs.slice(0, 2).map((doc) => (
              <div
                key={doc.id}
                onClick={() => onSelectDoc?.(doc)}
                className="card-mono"
                style={{
                  padding: '0.9rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                  <FileText size={18} color="#000000" style={{ flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#000000', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {doc.filename}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      {doc.chunks_count || 1} chunks · Processed
                    </div>
                  </div>
                </div>
                <ArrowRight size={15} color="#999999" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
