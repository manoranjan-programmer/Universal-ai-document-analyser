import React, { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import {
  Send,
  Sparkles,
  RotateCcw,
  BookOpen,
  FileText,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Bot,
  User,
  ExternalLink,
  Layers,
} from 'lucide-react'
import { askQuestion, fetchDocuments } from '../services/api'
import toast from 'react-hot-toast'

function SourceCard({ source, rank }) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  const rawPct = Math.round((source.similarity ?? 0) * 100)
  const displayScore = rawPct > 0 ? `${rawPct}% relevance` : 'High match'
  const isHighMatch = rawPct >= 60

  const handleCopy = (e) => {
    e.stopPropagation()
    navigator.clipboard.writeText(source.text || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '0.75rem 0.9rem',
        fontSize: '0.8rem',
        transition: 'all var(--transition-fast)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.5rem',
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
          <FileText size={15} style={{ color: 'var(--primary)', flexShrink: 0 }} />
          <span
            style={{
              fontWeight: 600,
              color: 'var(--text-main)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {source.filename || 'Document'}
          </span>
          <span className="badge badge-neutral" style={{ fontSize: '0.675rem' }}>
            p. {source.page ?? 1} · chunk #{source.chunk_id ?? rank}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          <span
            className={`badge ${isHighMatch ? 'badge-success' : 'badge-indigo'}`}
            style={{ fontSize: '0.675rem' }}
          >
            {displayScore}
          </span>
          {expanded ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
        </div>
      </div>

      {/* Snippet */}
      <div
        style={{
          marginTop: '0.5rem',
          color: 'var(--text-secondary)',
          fontSize: '0.775rem',
          lineHeight: 1.55,
          background: 'var(--bg-subtle)',
          padding: '0.6rem 0.75rem',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            maxHeight: expanded ? 'none' : '4.5rem',
            overflow: 'hidden',
            display: expanded ? 'block' : '-webkit-box',
            WebkitLineClamp: expanded ? 'unset' : 3,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {source.text}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.35rem' }}>
          <button
            type="button"
            onClick={handleCopy}
            className="btn btn-ghost btn-sm"
            style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem', gap: '0.25rem' }}
          >
            {copied ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy snippet'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function Message({ msg }) {
  const isUser = msg.role === 'user'

  return (
    <div
      className="animate-fade"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        marginBottom: '1.5rem',
      }}
    >
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          marginBottom: '0.35rem',
          padding: '0 0.25rem',
        }}
      >
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: isUser ? 'var(--primary-light)' : 'var(--violet-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isUser ? 'var(--primary)' : 'var(--violet)',
          }}
        >
          {isUser ? <User size={12} /> : <Bot size={12} />}
        </div>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          {isUser ? 'You' : 'AI Assistant'}
        </span>
        {msg.model && (
          <span className="badge badge-indigo" style={{ fontSize: '0.625rem', padding: '0.1rem 0.4rem' }}>
            {msg.model}
          </span>
        )}
      </div>

      {/* Bubble */}
      <div
        style={{
          maxWidth: '85%',
          padding: '1rem 1.25rem',
          background: isUser ? 'var(--primary)' : '#FFFFFF',
          color: isUser ? '#FFFFFF' : 'var(--text-main)',
          border: isUser ? 'none' : '1px solid var(--border)',
          borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          boxShadow: isUser ? '0 4px 12px rgba(79, 70, 229, 0.2)' : 'var(--shadow-sm)',
        }}
      >
        {isUser ? (
          <div style={{ fontSize: '0.9rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {msg.content}
          </div>
        ) : (
          <div className="chat-markdown">
            <ReactMarkdown>{msg.content}</ReactMarkdown>
          </div>
        )}
      </div>

      {/* Source citations */}
      {msg.sources && msg.sources.length > 0 && (
        <div style={{ maxWidth: '85%', width: '100%', marginTop: '0.85rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.725rem',
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '0.5rem',
            }}
          >
            <BookOpen size={14} style={{ color: 'var(--primary)' }} />
            <span>Retrieved Sources ({msg.sources.length})</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {msg.sources.map((src, i) => (
              <SourceCard key={i} source={src} rank={src.rank || i + 1} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ChatInterface({ documentId = null, initialQuery = '' }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState(initialQuery)
  const [loading, setLoading] = useState(false)
  const [selectedDocId, setSelectedDocId] = useState(documentId || '')
  const [docs, setDocs] = useState([])
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    fetchDocuments()
      .then((data) => setDocs(data.documents || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (documentId) {
      setSelectedDocId(documentId)
    }
  }, [documentId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSend = async (queryText) => {
    const q = (queryText || input).trim()
    if (!q || loading) return

    setInput('')

    // Append user message
    const userMsg = { role: 'user', content: q }
    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    try {
      const resp = await askQuestion(q, {
        document_id: selectedDocId || null,
        top_k: 5,
        history: messages,
      })

      const aiMsg = {
        role: 'assistant',
        content: resp.answer,
        sources: resp.sources || [],
        model: resp.model_used,
      }
      setMessages((prev) => [...prev, aiMsg])
    } catch (err) {
      toast.error(err.message || 'Failed to get answer from AI')
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ Error: ${err.message}`,
          sources: [],
        },
      ])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const clearChat = () => {
    setMessages([])
    toast.success('Conversation reset')
  }

  const SUGGESTIONS = [
    'What skills are mentioned in this document?',
    'Summarize the key qualifications and experience.',
    'What is the candidate\'s education and background?',
    'List all technologies and frameworks referenced.',
  ]

  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 120px)',
        minHeight: '600px',
        overflow: 'hidden',
      }}
    >
      {/* Chat Sub-Header */}
      <div
        style={{
          padding: '1rem 1.5rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          background: '#FFFFFF',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-md)',
              background: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
              Universal AI Assistant
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Retrieval-Augmented Generation over indexed documents
            </div>
          </div>
        </div>

        {/* Scope selector & Clear button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <select
            value={selectedDocId}
            onChange={(e) => setSelectedDocId(e.target.value)}
            className="input"
            style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.8rem', height: '34px' }}
          >
            <option value="">All Documents (Knowledge Base)</option>
            {docs.map((d) => (
              <option key={d.id} value={d.id}>
                {d.filename}
              </option>
            ))}
          </select>

          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="btn btn-secondary btn-sm"
              title="Clear chat history"
              style={{ gap: '0.35rem' }}
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.5rem',
          background: 'var(--bg-app)',
        }}
      >
        {messages.length === 0 ? (
          <div
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              maxWidth: 540,
              margin: '0 auto',
              padding: '2rem 1rem',
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem',
              }}
            >
              <Sparkles size={28} />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              Ask anything about your documents
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              The RAG engine will search through indexed chunks with FAISS vector similarity and produce precise citations and answers.
            </p>

            {/* Quick action suggestion chips */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
              {SUGGESTIONS.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(s)}
                  className="btn btn-secondary"
                  style={{
                    justifyContent: 'flex-start',
                    textAlign: 'left',
                    padding: '0.65rem 1rem',
                    fontSize: '0.825rem',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <Sparkles size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                  <span>{s}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            {messages.map((m, i) => (
              <Message key={i} msg={m} />
            ))}
          </div>
        )}

        {/* Loading animation */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0' }}>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: 'var(--violet-light)',
                color: 'var(--violet)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bot size={14} />
            </div>
            <div
              style={{
                padding: '0.75rem 1rem',
                background: '#FFFFFF',
                border: '1px solid var(--border)',
                borderRadius: '16px 16px 16px 4px',
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span>Analyzing document vectors…</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Floating Prompt Input Box */}
      <div
        style={{
          padding: '1.25rem 1.5rem',
          background: '#FFFFFF',
          borderTop: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'flex-end',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '0.65rem 0.85rem',
            transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-focus)'
            e.currentTarget.style.boxShadow = 'var(--shadow-focus)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <textarea
            ref={inputRef}
            id="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedDocId
                ? 'Ask a question about the selected document... (Enter to send)'
                : 'Ask a question across all documents... (Enter to send)'
            }
            rows={2}
            disabled={loading}
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              resize: 'none',
              fontFamily: 'inherit',
              fontSize: '0.875rem',
              color: 'var(--text-main)',
              lineHeight: 1.5,
            }}
          />

          <button
            id="ask-btn"
            type="button"
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="btn btn-primary"
            style={{
              padding: '0.5rem 0.9rem',
              borderRadius: 'var(--radius-md)',
              flexShrink: 0,
              gap: '0.35rem',
            }}
          >
            <span>Ask</span>
            <Send size={14} />
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '0.5rem',
            fontSize: '0.725rem',
            color: 'var(--text-muted)',
            padding: '0 0.25rem',
          }}
        >
          <span>Shift + Enter for new line · HuggingFace Inference Engine</span>
          {selectedDocId && (
            <span style={{ color: 'var(--primary)', fontWeight: 600 }}>
              Scoped to selected document
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
