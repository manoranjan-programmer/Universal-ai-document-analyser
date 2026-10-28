import React, { useRef, useEffect } from 'react'
import { ArrowUp, Loader2, Plus, Paperclip } from 'lucide-react'

export default function ChatInput({
  input,
  setInput,
  onSend,
  loading = false,
  onAttachClick,
  disabled = false,
  placeholder = 'Message Universal AI...',
}) {
  const textareaRef = useRef(null)

  // Auto-resize textarea to fit text dynamically like ChatGPT
  useEffect(() => {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      const newHeight = Math.min(el.scrollHeight, 180)
      el.style.height = `${newHeight}px`
    }
  }, [input])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (input.trim() && !loading && !disabled) {
        onSend()
      }
    }
  }

  const hasText = Boolean(input && input.trim())

  return (
    <div style={{ width: '100%', maxWidth: '768px', margin: '0 auto' }}>
      {/* ChatGPT Floating Input Capsule */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E5E5E5',
          borderRadius: '26px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06), 0 1px 4px rgba(0, 0, 0, 0.04)',
          padding: '0.65rem 0.85rem 0.65rem 0.75rem',
          display: 'flex',
          alignItems: 'flex-end',
          gap: '0.5rem',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = '#000000'
          e.currentTarget.style.boxShadow = '0 6px 24px rgba(0, 0, 0, 0.09)'
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = '#E5E5E5'
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.06)'
        }}
      >
        {/* Attachment button (+) */}
        <button
          type="button"
          onClick={onAttachClick}
          disabled={loading}
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'transparent',
            border: 'none',
            color: '#666666',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: loading ? 'not-allowed' : 'pointer',
            flexShrink: 0,
            marginBottom: '1px',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.background = '#F5F5F5'
              e.currentTarget.style.color = '#000000'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = '#666666'
          }}
          title="Upload or switch document"
        >
          <Plus size={18} />
        </button>

        {/* Dynamic Expanding Textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          disabled={loading || disabled}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            resize: 'none',
            fontSize: '0.93rem',
            fontFamily: 'inherit',
            color: '#000000',
            lineHeight: 1.5,
            padding: '4px 0',
            maxHeight: '180px',
            overflowY: 'auto',
          }}
        />

        {/* Circular Send Button */}
        <button
          type="button"
          onClick={() => {
            if (hasText && !loading && !disabled) {
              onSend()
            }
          }}
          disabled={!hasText || loading || disabled}
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: hasText && !loading ? '#000000' : '#E5E5E5',
            color: hasText && !loading ? '#FFFFFF' : '#A3A3A3',
            border: 'none',
            cursor: hasText && !loading ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginBottom: '1px',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            if (hasText && !loading) {
              e.currentTarget.style.transform = 'scale(1.05)'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
          }}
          title={hasText ? 'Send message' : 'Type a question'}
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" color="#000000" />
          ) : (
            <ArrowUp size={16} strokeWidth={2.5} />
          )}
        </button>
      </div>

      {/* ChatGPT Disclaimer */}
      <div
        style={{
          textAlign: 'center',
          fontSize: '0.72rem',
          color: '#888888',
          marginTop: '0.5rem',
          letterSpacing: '-0.01em',
        }}
      >
        Universal AI can make mistakes. Verify important document info.
      </div>
    </div>
  )
}
