import React, { useRef, useEffect } from 'react'
import {
  Sparkles,
  RotateCcw,
  LayoutTemplate,
  MessageSquare,
  SquarePen,
  ChevronDown,
  FileText,
  Briefcase,
  GraduationCap,
  Search,
} from 'lucide-react'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'

export default function ChatWindow({
  doc,
  messages = [],
  onSendMessage,
  onResetChat,
  loading = false,
  input,
  setInput,
  onAttachClick,
  activeTab = 'chat',
  onTabChange,
}) {
  const chatScrollRef = useRef(null)

  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Handle regenerating the last AI answer
  const handleRegenerateLast = () => {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')
    if (lastUserMsg?.content && !loading) {
      onSendMessage(lastUserMsg.content)
    }
  }

  // ChatGPT 2x2 Suggested Prompt Cards for new conversations
  const promptCards = [
    {
      icon: FileText,
      title: 'Summarize document',
      subtitle: 'Get key highlights and an executive summary',
      query: 'Please summarize this document with key highlights and main takeaways.',
    },
    {
      icon: Briefcase,
      title: 'Extract candidate & skills',
      subtitle: 'Identify candidate name, tech stack & experience',
      query: 'Extract the candidate name, contact info, core skills, and work history.',
    },
    {
      icon: GraduationCap,
      title: 'Verify education & degrees',
      subtitle: 'Check universities, degrees and graduation details',
      query: 'What education, degrees, colleges, or schools are mentioned in this document?',
    },
    {
      icon: Search,
      title: 'Check missing details',
      subtitle: 'Identify gaps or unmentioned sections',
      query: 'Are there any potential gaps, missing contact details, or missing sections?',
    },
  ]

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#FFFFFF',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* ── Top Header (ChatGPT Style Minimalist Navigation) ── */}
      <div
        style={{
          padding: '0.65rem 1.25rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#FFFFFF',
          zIndex: 10,
          minHeight: '52px',
        }}
      >
        {/* Model dropdown / Document Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.3rem 0.6rem',
              borderRadius: '8px',
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#F5F5F5')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#000000' }}>
              Universal AI
            </span>
            <span style={{ fontSize: '0.75rem', color: '#888888', fontWeight: 500 }}>
              4o
            </span>
            <ChevronDown size={14} color="#888888" />
          </div>

          {doc?.filename && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.76rem',
                color: '#666666',
                background: '#FAFAFA',
                padding: '0.2rem 0.6rem',
                borderRadius: '999px',
                border: '1px solid #E5E5E5',
                maxWidth: 240,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={doc.filename}
            >
              <FileText size={12} color="#000000" />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {doc.filename}
              </span>
            </div>
          )}
        </div>

        {/* Right Action buttons: View Switch + New Chat */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {onTabChange && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: '#F5F5F5',
                padding: '2px',
                borderRadius: '6px',
                border: '1px solid #E5E5E5',
              }}
            >
              <button
                type="button"
                onClick={() => onTabChange('chat')}
                style={{
                  background: activeTab === 'chat' ? '#FFFFFF' : 'transparent',
                  color: activeTab === 'chat' ? '#000000' : '#666666',
                  border: 'none',
                  padding: '0.25rem 0.6rem',
                  borderRadius: '4px',
                  fontSize: '0.74rem',
                  fontWeight: activeTab === 'chat' ? 600 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  boxShadow: activeTab === 'chat' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                <MessageSquare size={13} />
                <span>Chat</span>
              </button>
              <button
                type="button"
                onClick={() => onTabChange('analysis')}
                style={{
                  background: activeTab === 'analysis' ? '#FFFFFF' : 'transparent',
                  color: activeTab === 'analysis' ? '#000000' : '#666666',
                  border: 'none',
                  padding: '0.25rem 0.6rem',
                  borderRadius: '4px',
                  fontSize: '0.74rem',
                  fontWeight: activeTab === 'analysis' ? 600 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  boxShadow: activeTab === 'analysis' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                <LayoutTemplate size={13} />
                <span>Cards</span>
              </button>
            </div>
          )}

          {/* New Chat icon button */}
          <button
            type="button"
            onClick={onResetChat}
            style={{
              background: 'none',
              border: 'none',
              padding: '0.4rem',
              borderRadius: '6px',
              cursor: 'pointer',
              color: '#666666',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#F5F5F5'
              e.currentTarget.style.color = '#000000'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = '#666666'
            }}
            title="Start new chat"
          >
            <SquarePen size={17} />
          </button>
        </div>
      </div>

      {/* ── Scrollable Conversation Canvas ── */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          paddingBottom: '8.5rem', // Generous padding so content isn't covered by floating input
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '768px',
            margin: '0 auto',
            padding: '2rem 1.25rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
          }}
        >
          {/* If no messages yet: Render Authentic ChatGPT Welcome State */}
          {messages.length === 0 ? (
            <div
              className="animate-fade"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                minHeight: '380px',
                textAlign: 'center',
              }}
            >
              {/* ChatGPT Icon */}
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: '#000000',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
                }}
              >
                <Sparkles size={24} />
              </div>

              {/* ChatGPT Welcome Heading */}
              <h1
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: '#000000',
                  marginBottom: '0.4rem',
                  letterSpacing: '-0.02em',
                }}
              >
                What can I help with?
              </h1>
              <p
                style={{
                  fontSize: '0.88rem',
                  color: '#666666',
                  maxWidth: '480px',
                  marginBottom: '2.5rem',
                }}
              >
                {doc?.filename
                  ? `Ask any question about "${doc.filename}". Answers are strictly grounded in your document.`
                  : 'Upload or select a document to start intelligent question answering.'}
              </p>

              {/* 2x2 Prompt Suggestion Cards Grid (ChatGPT style) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '0.75rem',
                  width: '100%',
                }}
              >
                {promptCards.map((card, idx) => {
                  const Icon = card.icon
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => onSendMessage(card.query)}
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #E5E5E5',
                        borderRadius: '14px',
                        padding: '1rem',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        minHeight: '90px',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#000000'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)'
                        e.currentTarget.style.transform = 'translateY(-1px)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#E5E5E5'
                        e.currentTarget.style.boxShadow = 'none'
                        e.currentTarget.style.transform = 'translateY(0)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <Icon size={16} color="#000000" />
                        <span style={{ fontSize: '0.86rem', fontWeight: 600, color: '#000000' }}>
                          {card.title}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.76rem', color: '#737373', lineHeight: 1.4 }}>
                        {card.subtitle}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            /* Active Message History */
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {messages.map((msg, i) => (
                <ChatMessage
                  key={msg.id || i}
                  message={msg}
                  index={i}
                  isLast={i === messages.length - 1}
                  onRegenerate={handleRegenerateLast}
                />
              ))}

              {/* ChatGPT Thinking / Typing Indicator */}
              {loading && (
                <div
                  className="animate-fade"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    marginBottom: '1.5rem',
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
                    }}
                  >
                    <Sparkles size={13} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: '#000000',
                        display: 'inline-block',
                        animation: 'pulseDot 1.4s infinite ease-in-out both',
                      }}
                    />
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: '#000000',
                        display: 'inline-block',
                        animation: 'pulseDot 1.4s infinite ease-in-out both',
                        animationDelay: '0.2s',
                      }}
                    />
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: '#000000',
                        display: 'inline-block',
                        animation: 'pulseDot 1.4s infinite ease-in-out both',
                        animationDelay: '0.4s',
                      }}
                    />
                    <span style={{ fontSize: '0.78rem', color: '#888888', marginLeft: '0.35rem' }}>
                      Thinking...
                    </span>
                  </div>
                </div>
              )}

              <div ref={chatScrollRef} />
            </div>
          )}
        </div>
      </div>

      {/* ── Fixed Floating Bottom Input Bar (ChatGPT Signature Pill) ── */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, #FFFFFF 35%, #FFFFFF 100%)',
          padding: '1.5rem 1.25rem 0.85rem',
          zIndex: 20,
        }}
      >
        <ChatInput
          input={input}
          setInput={setInput}
          onSend={() => onSendMessage(input)}
          loading={loading}
          onAttachClick={onAttachClick}
          placeholder={
            doc?.filename
              ? `Ask anything about ${doc.filename}...`
              : 'Message Universal AI...'
          }
        />
      </div>
    </div>
  )
}
