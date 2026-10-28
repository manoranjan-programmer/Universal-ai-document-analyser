import React, { useState } from 'react'
import {
  FileText,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Layers,
  Copy,
  Check,
} from 'lucide-react'

export default function DocumentViewer({
  doc,
  chunks = [],
  activePage = 1,
  onPageChange,
}) {
  const [zoom, setZoom] = useState(100)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [viewMode, setViewMode] = useState('page') // 'page' or 'chunks'
  const [copiedChunk, setCopiedChunk] = useState(null)

  const totalPages = doc?.pages || 1

  const handleZoomIn = () => setZoom((z) => Math.min(z + 15, 200))
  const handleZoomOut = () => setZoom((z) => Math.max(z - 15, 60))
  const handleResetZoom = () => setZoom(100)

  const handleCopyChunk = (text, idx) => {
    navigator.clipboard.writeText(text)
    setCopiedChunk(idx)
    setTimeout(() => setCopiedChunk(null), 1800)
  }

  // Filter chunks for current page if available, else show all
  const pageChunks = chunks.filter((c) => (c.page_number || 1) === activePage)
  const displayChunks = pageChunks.length > 0 ? pageChunks : chunks

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#FFFFFF',
        position: isFullscreen ? 'fixed' : 'relative',
        inset: isFullscreen ? 0 : 'auto',
        zIndex: isFullscreen ? 100 : 1,
      }}
    >
      {/* ── Top Control Bar ── */}
      <div
        style={{
          padding: '0.65rem 1rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
          background: '#FFFFFF',
        }}
      >
        {/* Document Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: '6px',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <FileText size={14} color="#000000" />
          </div>
          <span
            style={{
              fontWeight: 700,
              fontSize: '0.825rem',
              color: '#000000',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '180px',
            }}
            title={doc?.filename}
          >
            {doc?.filename || 'Document'}
          </span>
          <span
            style={{
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              border: '1px solid var(--border)',
              padding: '0.1rem 0.4rem',
              borderRadius: 'var(--radius-sm)',
              textTransform: 'uppercase',
            }}
          >
            {doc?.file_type || 'PDF'}
          </span>
        </div>

        {/* View Toggle (Page vs Chunks) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-subtle)',
            padding: '2px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
          }}
        >
          <button
            onClick={() => setViewMode('page')}
            style={{
              background: viewMode === 'page' ? '#FFFFFF' : 'transparent',
              color: viewMode === 'page' ? '#000000' : 'var(--text-secondary)',
              border: 'none',
              padding: '0.2rem 0.6rem',
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontWeight: viewMode === 'page' ? 600 : 500,
              cursor: 'pointer',
              boxShadow: viewMode === 'page' ? 'var(--shadow-xs)' : 'none',
            }}
          >
            Preview
          </button>
          <button
            onClick={() => setViewMode('chunks')}
            style={{
              background: viewMode === 'chunks' ? '#FFFFFF' : 'transparent',
              color: viewMode === 'chunks' ? '#000000' : 'var(--text-secondary)',
              border: 'none',
              padding: '0.2rem 0.6rem',
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontWeight: viewMode === 'chunks' ? 600 : 500,
              cursor: 'pointer',
              boxShadow: viewMode === 'chunks' ? 'var(--shadow-xs)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            <Layers size={11} />
            <span>Chunks ({chunks.length})</span>
          </button>
        </div>

        {/* Zoom & Page Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {/* Zoom controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
            <button
              onClick={handleZoomOut}
              className="btn btn-ghost btn-sm"
              style={{ padding: '0.25rem 0.35rem' }}
              title="Zoom Out"
            >
              <ZoomOut size={14} color="#000000" />
            </button>
            <span
              onClick={handleResetZoom}
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                minWidth: '38px',
                textAlign: 'center',
              }}
              title="Click to reset zoom"
            >
              {zoom}%
            </span>
            <button
              onClick={handleZoomIn}
              className="btn btn-ghost btn-sm"
              style={{ padding: '0.25rem 0.35rem' }}
              title="Zoom In"
            >
              <ZoomIn size={14} color="#000000" />
            </button>
          </div>

          <div style={{ width: '1px', height: '16px', background: 'var(--border)' }} />

          {/* Page nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            <button
              onClick={() => onPageChange?.(Math.max(activePage - 1, 1))}
              disabled={activePage <= 1}
              className="btn btn-ghost btn-sm"
              style={{ padding: '0.25rem 0.35rem' }}
              title="Previous Page"
            >
              <ChevronLeft size={14} color="#000000" />
            </button>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#000000' }}>
              {activePage} / {totalPages}
            </span>
            <button
              onClick={() => onPageChange?.(Math.min(activePage + 1, totalPages))}
              disabled={activePage >= totalPages}
              className="btn btn-ghost btn-sm"
              style={{ padding: '0.25rem 0.35rem' }}
              title="Next Page"
            >
              <ChevronRight size={14} color="#000000" />
            </button>
          </div>

          <div style={{ width: '1px', height: '16px', background: 'var(--border)' }} />

          {/* Fullscreen */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="btn btn-ghost btn-sm"
            style={{ padding: '0.25rem 0.35rem' }}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={14} color="#000000" /> : <Maximize2 size={14} color="#000000" />}
          </button>
        </div>
      </div>

      {/* ── Document Viewport ── */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'auto',
          background: 'var(--bg-secondary)',
          padding: '1.5rem',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
        }}
      >
        {viewMode === 'page' ? (
          /* Simulated Clean Document Page */
          <div
            style={{
              width: '100%',
              maxWidth: `${Math.round(620 * (zoom / 100))}px`,
              background: '#FFFFFF',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
              padding: `${Math.round(28 * (zoom / 100))}px`,
              transition: 'all 0.15s ease-out',
              minHeight: `${Math.round(750 * (zoom / 100))}px`,
              color: '#000000',
              fontFamily: 'inherit',
            }}
          >
            {/* Page Header */}
            <div
              style={{
                borderBottom: '1px solid var(--border)',
                paddingBottom: '0.75rem',
                marginBottom: '1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h4 style={{ fontSize: `${Math.max(12, Math.round(15 * (zoom / 100)))}px`, fontWeight: 700, margin: 0 }}>
                  {doc?.filename}
                </h4>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Indexed Page {activePage} of {totalPages}
                </span>
              </div>
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                }}
              >
                AI OCR Grounded
              </span>
            </div>

            {/* Chunks content on this page */}
            {displayChunks.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {displayChunks.map((chunk, idx) => (
                  <div
                    key={chunk.chunk_id || idx}
                    style={{
                      fontSize: `${Math.max(11, Math.round(13 * (zoom / 100)))}px`,
                      lineHeight: 1.7,
                      color: '#1A1A1A',
                      whiteSpace: 'pre-wrap',
                      background: 'transparent',
                    }}
                  >
                    {chunk.text}
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  padding: '3rem 1rem',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                }}
              >
                No extracted text available for Page {activePage}.
              </div>
            )}
          </div>
        ) : (
          /* Chunks Inspection List */
          <div style={{ width: '100%', maxWidth: '780px', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {chunks.map((chunk, idx) => (
              <div
                key={chunk.chunk_id || idx}
                className="card-mono"
                style={{
                  padding: '1rem 1.2rem',
                  background: '#FFFFFF',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.5rem',
                    borderBottom: '1px solid var(--border)',
                    paddingBottom: '0.4rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#000000' }}>
                      Chunk #{chunk.chunk_id || idx + 1}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Page {chunk.page_number || 1} · {chunk.text?.length || 0} chars
                    </span>
                  </div>

                  <button
                    onClick={() => handleCopyChunk(chunk.text, idx)}
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem', gap: '0.25rem' }}
                  >
                    {copiedChunk === idx ? <Check size={12} color="#000000" /> : <Copy size={12} />}
                    <span>{copiedChunk === idx ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div
                  style={{
                    fontSize: '0.825rem',
                    color: '#262626',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'inherit',
                  }}
                >
                  {chunk.text}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
