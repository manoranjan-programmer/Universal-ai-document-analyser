import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import {
  Sparkles,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  CheckCheck,
} from 'lucide-react'

export default function ChatMessage({
  message,
  index,
  onRegenerate,
  isLast = false,
}) {
  const isUser = message.role === 'user'
  const [copied, setCopied] = useState(false)
  const [sourcesOpen, setSourcesOpen] = useState(false)
  const [feedback, setFeedback] = useState(null) // 'like' | 'dislike' | null

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── USER MESSAGE (ChatGPT style right-aligned rounded bubble) ──
  if (isUser) {
    return (
      <div
        className="animate-fade"
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: '1.5rem',
          width: '100%',
        }}
      >
        <div
          style={{
            maxWidth: '78%',
            background: '#000000',
            color: '#FFFFFF',
            borderRadius: '20px 20px 4px 20px',
            padding: '0.75rem 1.25rem',
            fontSize: '0.93rem',
            lineHeight: 1.55,
            wordBreak: 'break-word',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
          }}
        >
          {message.content}
        </div>
      </div>
    )
  }

  // ── ASSISTANT MESSAGE (ChatGPT style: Direct typography, no outer card box) ──
  return (
    <div
      className="animate-fade"
      style={{
        display: 'flex',
        flexDirection: 'column',
        marginBottom: '2rem',
        width: '100%',
      }}
    >
      {/* ChatGPT Assistant Header: Circular Avatar + Name */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          marginBottom: '0.65rem',
        }}
      >
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: '50%',
            background: '#000000',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
          }}
        >
          <Sparkles size={13} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#000000' }}>
            Universal AI
          </span>
          {message.time && (
            <span style={{ fontSize: '0.7rem', color: '#999999' }}>
              · {message.time}
            </span>
          )}
        </div>
      </div>

      {/* Direct Content Stream (Clean ChatGPT Markdown Typography) */}
      <div
        style={{
          paddingLeft: '2.1rem',
          color: '#000000',
          fontSize: '0.93rem',
          lineHeight: 1.7,
        }}
      >
        <div className="chatgpt-markdown">
          <ReactMarkdown
            components={{
              // Custom code block renderer with ChatGPT dark top bar
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '')
                const lang = match ? match[1] : ''
                const codeStr = String(children).replace(/\n$/, '')

                if (!inline && lang) {
                  return (
                    <div
                      style={{
                        margin: '1rem 0',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        background: '#0D0D0D',
                        border: '1px solid #262626',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.4rem 0.85rem',
                          background: '#1A1A1A',
                          color: '#A3A3A3',
                          fontSize: '0.72rem',
                          fontFamily: 'monospace',
                        }}
                      >
                        <span>{lang}</span>
                        <button
                          type="button"
                          onClick={() => navigator.clipboard.writeText(codeStr)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#D4D4D4',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            fontSize: '0.72rem',
                          }}
                        >
                          <Copy size={12} />
                          <span>Copy code</span>
                        </button>
                      </div>
                      <pre style={{ margin: 0, padding: '0.85rem', overflowX: 'auto', color: '#F5F5F5', fontSize: '0.84rem' }}>
                        <code>{children}</code>
                      </pre>
                    </div>
                  )
                }

                if (!inline) {
                  return (
                    <pre
                      style={{
                        background: '#F5F5F5',
                        padding: '0.85rem',
                        borderRadius: '6px',
                        overflowX: 'auto',
                        fontSize: '0.84rem',
                        border: '1px solid #E5E5E5',
                        margin: '0.75rem 0',
                      }}
                    >
                      <code>{children}</code>
                    </pre>
                  )
                }

                return (
                  <code
                    style={{
                      background: '#F5F5F5',
                      border: '1px solid #E5E5E5',
                      padding: '0.15rem 0.35rem',
                      borderRadius: '4px',
                      fontSize: '0.84rem',
                      fontFamily: 'monospace',
                      color: '#000000',
                    }}
                    {...props}
                  >
                    {children}
                  </code>
                )
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>

        {/* ── Document Source Citations (ChatGPT / Perplexity Style Pill Badges) ── */}
        {message.sources && message.sources.length > 0 && (
          <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #EEEEEE' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.45rem',
              }}
            >
              <button
                type="button"
                onClick={() => setSourcesOpen(!sourcesOpen)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#000000',
                  background: '#F5F5F5',
                  border: '1px solid #E5E5E5',
                  borderRadius: '16px',
                  padding: '0.25rem 0.65rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <FileText size={12} color="#666666" />
                <span>{message.sources.length} document sources</span>
                {sourcesOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>

              {/* Quick source pills */}
              {!sourcesOpen &&
                message.sources.slice(0, 3).map((src, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: '0.72rem',
                      color: '#666666',
                      background: '#FFFFFF',
                      border: '1px solid #E5E5E5',
                      borderRadius: '12px',
                      padding: '0.2rem 0.5rem',
                    }}
                  >
                    Page {src.page ?? 1} · {Math.round((src.similarity ?? 0.8) * 100)}% match
                  </span>
                ))}
            </div>

            {/* Expandable detailed source inspection */}
            {sourcesOpen && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  marginTop: '0.75rem',
                }}
              >
                {message.sources.map((src, i) => {
                  const pct = Math.round((src.similarity ?? 0.8) * 100)
                  return (
                    <div
                      key={i}
                      style={{
                        padding: '0.65rem 0.85rem',
                        background: '#FAFAFA',
                        border: '1px solid #E5E5E5',
                        borderRadius: '8px',
                        fontSize: '0.78rem',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '0.35rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, color: '#000000' }}>
                          <FileText size={13} color="#666666" />
                          <span>{src.filename || 'Document'}</span>
                          <span style={{ color: '#888888', fontWeight: 400 }}>
                            · Page {src.page ?? 1} · Chunk #{src.chunk_id ?? i + 1}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '0.1rem 0.45rem',
                            background: '#FFFFFF',
                            border: '1px solid #E5E5E5',
                            borderRadius: '999px',
                            color: '#000000',
                          }}
                        >
                          {pct}% match
                        </span>
                      </div>
                      <div style={{ color: '#555555', lineHeight: 1.5, fontSize: '0.76rem' }}>
                        "{src.text}"
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── ChatGPT Action Toolbar (Copy, Like, Dislike, Regenerate) ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            marginTop: '0.75rem',
            paddingTop: '0.25rem',
          }}
        >
          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            className="chatgpt-toolbar-btn"
            title="Copy response"
            style={{
              background: 'none',
              border: 'none',
              padding: '0.3rem 0.45rem',
              borderRadius: '6px',
              cursor: 'pointer',
              color: copied ? '#000000' : '#888888',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              fontSize: '0.72rem',
              transition: 'all 0.15s ease',
            }}
          >
            {copied ? <Check size={14} color="#000000" /> : <Copy size={14} />}
            {copied && <span style={{ fontWeight: 600 }}>Copied</span>}
          </button>

          {/* Thumbs Up Button */}
          <button
            type="button"
            onClick={() => setFeedback(feedback === 'like' ? null : 'like')}
            className="chatgpt-toolbar-btn"
            title="Good response"
            style={{
              background: feedback === 'like' ? '#F5F5F5' : 'none',
              border: 'none',
              padding: '0.3rem 0.45rem',
              borderRadius: '6px',
              cursor: 'pointer',
              color: feedback === 'like' ? '#000000' : '#888888',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.15s ease',
            }}
          >
            <ThumbsUp size={14} />
          </button>

          {/* Thumbs Down Button */}
          <button
            type="button"
            onClick={() => setFeedback(feedback === 'dislike' ? null : 'dislike')}
            className="chatgpt-toolbar-btn"
            title="Bad response"
            style={{
              background: feedback === 'dislike' ? '#F5F5F5' : 'none',
              border: 'none',
              padding: '0.3rem 0.45rem',
              borderRadius: '6px',
              cursor: 'pointer',
              color: feedback === 'dislike' ? '#000000' : '#888888',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.15s ease',
            }}
          >
            <ThumbsDown size={14} />
          </button>

          {/* Regenerate Button (if last AI message and callback available) */}
          {isLast && onRegenerate && (
            <button
              type="button"
              onClick={onRegenerate}
              className="chatgpt-toolbar-btn"
              title="Regenerate response"
              style={{
                background: 'none',
                border: 'none',
                padding: '0.3rem 0.45rem',
                borderRadius: '6px',
                cursor: 'pointer',
                color: '#888888',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.72rem',
                transition: 'all 0.15s ease',
              }}
            >
              <RotateCcw size={13} />
              <span>Regenerate</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
