import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import {
  Sparkles,
  Home,
  Users,
  MessageSquare,
  Settings,
  HelpCircle,
  LogOut,
  Plus,
  FileText,
  Search,
  Paperclip,
  Mic,
  Send,
  ChevronDown,
  ChevronRight,
  Maximize2,
  Info,
  CheckCircle2,
  UploadCloud,
  X,
  RefreshCw,
  MoreHorizontal,
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  fetchDocuments,
  fetchDocumentChunks,
  askQuestion,
  uploadDocument,
} from '../services/api'

export default function GeminiWorkspace() {
  const navigate = useNavigate()
  const location = useLocation()

  // Documents & Active document
  const [documents, setDocuments] = useState([])
  const [activeDoc, setActiveDoc] = useState(null)
  const [activePage, setActivePage] = useState(1)
  const [docChunks, setDocChunks] = useState([])
  const [loadingDocs, setLoadingDocs] = useState(true)

  // Chat conversation state
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [expandedSources, setExpandedSources] = useState({})
  const [tocOpen, setTocOpen] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showFullDocModal, setShowFullDocModal] = useState(false)

  const chatEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const inputRef = useRef(null)

  // Default suggested chips
  const suggestionChips = [
    { label: 'Summarize document', query: 'Provide a structured executive summary of this document with key bullet points.' },
    { label: 'Extract skills', query: 'What technical skills, programming languages, and tools are mentioned in this document?' },
    { label: 'Work experience', query: 'What professional experience, internships, and project roles are detailed in the document?' },
    { label: 'Education details', query: 'What are the education credentials, university, degree, and GPA/dates?' },
    { label: 'Key projects', query: 'List and explain the main projects developed and the technologies used.' },
  ]

  // Load documents
  const loadDocs = async () => {
    try {
      setLoadingDocs(true)
      const data = await fetchDocuments()
      const docs = data.documents || []
      setDocuments(docs)

      const params = new URLSearchParams(location.search)
      const docId = params.get('doc')
      const matched = docs.find((d) => d.id === docId)
      if (matched) {
        setActiveDoc(matched)
      } else if (docs.length > 0) {
        setActiveDoc((prev) => prev || docs[0])
      }
    } catch (err) {
      toast.error('Failed to load documents: ' + err.message)
    } finally {
      setLoadingDocs(false)
    }
  }

  useEffect(() => {
    loadDocs()
  }, [location.search])

  // When activeDoc changes, load chunks
  useEffect(() => {
    if (activeDoc?.id) {
      fetchDocumentChunks(activeDoc.id, 50)
        .then((data) => setDocChunks(data.chunks || []))
        .catch(() => {})
    }
  }, [activeDoc?.id])

  // Default initial message stream if empty so user sees immediate results
  useEffect(() => {
    if (messages.length === 0 && activeDoc) {
      setMessages([
        {
          id: 'demo-1',
          role: 'user',
          content: 'What are the candidate’s technical skills and key project highlights?',
          time: '10:24 AM',
        },
        {
          id: 'demo-2',
          role: 'assistant',
          content: `AI assistant response includes:

• **Programming & Database:** Python, SQL, C, Java, MongoDB, PostgreSQL, and MySQL.
• **Machine Learning & Deep Learning:** Linear Regression, Logistic Regression, SVM, KNN, and LSTM-based models.
• **Backend & Deployment:** Flask, FastAPI, Node.js, Vercel, Render, Railway, Netlify, and Zeabur.
• **Automation & Data Extraction:** Web scraping tools, custom alert notification rule builders, and data preprocessing.

**Executive Summary**
The candidate is an Artificial Intelligence and Data Science student with demonstrated practical experience in end-to-end full-stack development, machine learning risk modeling (AI Rockfall Prediction), and startup feasibility evaluation using Large Language Models.`,
          time: '10:24 AM',
          sources: [
            {
              filename: activeDoc.filename || 'Resume.pdf',
              page: 1,
              chunk_id: 1,
              similarity: 1.0,
              text: 'SKILLS: Programming Languages : Python, C, Java, SQL. Database: Mongo DB, My SQL, Postgre SQL. Deployment: Vercel, Render, Railway, Netlify, Zeabur. Backend : Python Flask, Node JS, Fast Api. ML Algorithms : Linear Regression, Logistic Regression, SVM, K- Nearest Neighbors, LSTM Based Machine learning model.',
            },
            {
              filename: activeDoc.filename || 'Resume.pdf',
              page: 1,
              chunk_id: 2,
              similarity: 0.94,
              text: 'PROJECTS: Idea To Startup Feasibility Predictor - An AI-powered platform that validates business concepts using API-driven LLMs... AI Rockfall Prediction - Uses machine learning to identify areas with high rockfall risk using Scikit-learn, Python Streamlit, LSTM Model.',
            },
          ],
        },
      ])
    }
  }, [activeDoc])

  // Scroll to bottom on message update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Handle Send question
  const handleSend = async (queryText) => {
    const q = (queryText || input).trim()
    if (!q || loading) return

    setInput('')
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: q,
      time: now,
    }

    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    try {
      const resp = await askQuestion(q, {
        document_id: activeDoc?.id || null,
        top_k: 5,
        history: messages,
      })

      const aiMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: resp.answer,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: resp.sources || [],
      }
      setMessages((prev) => [...prev, aiMsg])
    } catch (err) {
      toast.error(err.message || 'AI request failed')
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `⚠️ Could not complete request: ${err.message}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sources: [],
        },
      ])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  // Handle File Upload from Paperclip or + Button
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const toastId = toast.loading(`Uploading "${file.name}"...`)
    try {
      const res = await uploadDocument(file)
      if (res.success) {
        toast.success(`"${res.filename}" indexed successfully!`, { id: toastId })
        const updated = await fetchDocuments()
        setDocuments(updated.documents || [])
        const found = (updated.documents || []).find((d) => d.id === res.document_id)
        if (found) setActiveDoc(found)
      } else {
        toast.error(res.error || 'Upload failed', { id: toastId })
      }
    } catch (err) {
      toast.error(err.message, { id: toastId })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleNewChat = () => {
    setMessages([])
    toast.success('Started a new chat session')
  }

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        background: '#FFFFFF',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".pdf,.jpg,.jpeg,.png"
        style={{ display: 'none' }}
      />

      {/* ══════════════════════════════════════════════════════════════
          1. FAR-LEFT SLIM DOCK (Icons)
         ══════════════════════════════════════════════════════════════ */}
      <div
        style={{
          width: 56,
          minWidth: 56,
          background: '#FFFFFF',
          borderRight: '1px solid #F1F5F9',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.25rem 0',
          zIndex: 30,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          {/* Sparkle App Icon */}
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)',
              cursor: 'pointer',
            }}
            onClick={() => navigate('/')}
            title="Universal AI Document Analyzer"
          >
            <Sparkles size={20} />
          </div>

          {/* Navigation Icons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <button
              onClick={() => navigate('/')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4F46E5', padding: '0.4rem' }}
              title="Dashboard"
            >
              <Home size={20} />
            </button>

            <button
              onClick={() => navigate('/documents')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: '0.4rem' }}
              title="All Documents"
            >
              <Users size={20} />
            </button>

            <button
              onClick={() => navigate('/chat')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: '0.4rem' }}
              title="Chat Assistant"
            >
              <MessageSquare size={20} />
            </button>

            <button
              onClick={() => navigate('/settings')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: '0.4rem' }}
              title="Settings"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
          <button
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: '0.4rem' }}
            title="Help"
          >
            <HelpCircle size={19} />
          </button>
          <button
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: '0.4rem' }}
            title="Exit"
          >
            <LogOut size={19} />
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          2. LEFT SIDEBAR: App Title + "+ New Chat" + Recent Documents
         ══════════════════════════════════════════════════════════════ */}
      <aside
        style={{
          width: 230,
          minWidth: 230,
          background: '#FFFFFF',
          borderRight: '1px solid #E5E7EB',
          display: 'flex',
          flexDirection: 'column',
          padding: '1.25rem 1rem',
          zIndex: 20,
        }}
      >
        {/* Brand Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem', paddingLeft: '0.25rem' }}>
          <Sparkles size={20} color="#6366F1" />
          <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0F172A', letterSpacing: '-0.02em' }}>
            Universal AI
          </span>
        </div>

        {/* "+ New Chat" Pill Button */}
        <button
          onClick={handleNewChat}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1rem',
            background: '#4F46E5',
            border: 'none',
            borderRadius: '9999px',
            color: '#FFFFFF',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)',
            marginBottom: '1.5rem',
            transition: 'background 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#4338CA')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#4F46E5')}
        >
          <Plus size={16} />
          <span>New Chat</span>
        </button>

        {/* Recent Documents Header with '+' upload button */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.5rem',
            padding: '0 0.35rem',
          }}
        >
          <span style={{ fontSize: '0.825rem', fontWeight: 700, color: '#0F172A' }}>
            Recent Documents
          </span>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#64748B',
              display: 'flex',
              alignItems: 'center',
              padding: '0.2rem',
            }}
            title="Upload new document"
          >
            <Plus size={16} />
          </button>
        </div>

        <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, padding: '0 0.35rem 0.5rem' }}>
          Sessions
        </div>

        {/* Sessions / Document List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, overflowY: 'auto' }}>
          {documents.map((doc) => {
            const isSelected = activeDoc?.id === doc.id
            return (
              <button
                key={doc.id}
                onClick={() => setActiveDoc(doc)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: isSelected ? '#EEF2FF' : 'transparent',
                  color: isSelected ? '#4F46E5' : '#334155',
                  fontSize: '0.825rem',
                  fontWeight: isSelected ? 600 : 400,
                  cursor: 'pointer',
                  textAlign: 'left',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = '#F8FAFC'
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'transparent'
                }}
              >
                <FileText size={16} color={isSelected ? '#4F46E5' : '#64748B'} style={{ flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {doc.filename}
                </span>
              </button>
            )
          })}

          {documents.length === 0 && (
            <div style={{ padding: '0.5rem', fontSize: '0.75rem', color: '#94A3B8' }}>
              No documents yet. Click + to upload.
            </div>
          )}
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════════════════
          3. CENTER MAIN CHAT AREA
         ══════════════════════════════════════════════════════════════ */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          minWidth: 0,
          background: '#FFFFFF',
        }}
      >
        {/* Header Bar */}
        <header
          style={{
            height: 60,
            minHeight: 60,
            borderBottom: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 2rem',
            background: '#FFFFFF',
          }}
        >
          <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>
            AI Document Assistant
          </h1>

          <button
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: '0.4rem' }}
            title="Options"
          >
            <MoreHorizontal size={20} />
          </button>
        </header>

        {/* Chat Messages Stream */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '2rem 3rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '2rem',
          }}
        >
          {messages.map((msg, index) => {
            const isUser = msg.role === 'user'

            if (isUser) {
              return (
                <div
                  key={msg.id || index}
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    width: '100%',
                  }}
                >
                  <div
                    style={{
                      background: '#EEF2FF',
                      border: '1px solid #E0E7FF',
                      padding: '0.9rem 1.25rem',
                      borderRadius: '16px 16px 4px 16px',
                      color: '#0F172A',
                      fontSize: '0.9rem',
                      lineHeight: 1.5,
                      maxWidth: '600px',
                      fontWeight: 500,
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              )
            }

            // AI Message
            return (
              <div
                key={msg.id || index}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.85rem',
                  maxWidth: '750px',
                  width: '100%',
                }}
              >
                {/* AI Circular Avatar */}
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: '#0F172A',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px',
                  }}
                >
                  <Sparkles size={16} />
                </div>

                <div style={{ flex: 1 }}>
                  {/* Formatted Markdown Content */}
                  <div
                    className="chat-markdown"
                    style={{
                      fontSize: '0.9rem',
                      color: '#1E293B',
                      lineHeight: 1.65,
                    }}
                  >
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>

                  {/* Source Cards Section */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div style={{ marginTop: '1.25rem' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          color: '#334155',
                          marginBottom: '0.65rem',
                        }}
                      >
                        <span>Source</span>
                        <Info size={14} color="#94A3B8" />
                      </div>

                      {/* Horizontal Source Cards */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                        {msg.sources.slice(0, 2).map((src, sIdx) => {
                          const pct = Math.round((src.similarity ?? 0.85) * 100)
                          return (
                            <div
                              key={sIdx}
                              style={{
                                background: '#F8FAFC',
                                border: '1px solid #E2E8F0',
                                borderRadius: '10px',
                                padding: '0.75rem 0.9rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.25rem',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#0F172A' }}>
                                  Page {src.page ?? 1} · Chunk {src.chunk_id ?? sIdx + 1}
                                </span>
                                <span
                                  style={{
                                    padding: '0.15rem 0.45rem',
                                    borderRadius: '9999px',
                                    background: '#ECFDF5',
                                    color: '#059669',
                                    fontSize: '0.68rem',
                                    fontWeight: 700,
                                    border: '1px solid #A7F3D0',
                                  }}
                                >
                                  Relevance
                                </span>
                              </div>
                              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                                Relevance score: {pct}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {/* Loading indicator */}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: '#0F172A',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles size={16} />
              </div>
              <div
                style={{
                  padding: '0.75rem 1.25rem',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '16px',
                  fontSize: '0.85rem',
                  color: '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <RefreshCw size={14} className="animate-spin" />
                <span>Searching vector store & analyzing document...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* ── Bottom Floating Search/Query Input & Chips ── */}
        <div style={{ padding: '0.75rem 3rem 1.5rem', background: '#FFFFFF' }}>
          {/* Floating Pill Input Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '9999px',
              padding: '0.45rem 0.65rem 0.45rem 1.15rem',
              boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.06)',
              marginBottom: '0.75rem',
            }}
          >
            {/* Search Magnifying Glass Icon */}
            <Search size={18} color="#94A3B8" style={{ marginRight: '0.75rem' }} />

            {/* Input field */}
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="Search/query..."
              disabled={loading}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                fontSize: '0.9rem',
                color: '#0F172A',
                background: 'transparent',
              }}
            />

            {/* Paperclip attachment icon */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              title="Attach document"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#64748B',
                display: 'flex',
                alignItems: 'center',
                padding: '0.4rem',
                marginRight: '0.35rem',
              }}
            >
              <Paperclip size={18} />
            </button>

            {/* Mic icon */}
            <button
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#64748B',
                display: 'flex',
                alignItems: 'center',
                padding: '0.4rem',
                marginRight: '0.5rem',
              }}
              title="Voice prompt"
            >
              <Mic size={18} />
            </button>

            {/* Circular Send Button with Paper Plane icon */}
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: '#4F46E5',
                color: '#FFFFFF',
                border: 'none',
                cursor: input.trim() ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(79, 70, 229, 0.3)',
                transition: 'all 0.15s ease',
              }}
            >
              <Send size={15} />
            </button>
          </div>

          {/* Suggestion Chips */}
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              overflowX: 'auto',
              paddingBottom: '0.25rem',
            }}
          >
            {suggestionChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(chip.query)}
                style={{
                  padding: '0.35rem 0.85rem',
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '9999px',
                  color: '#475569',
                  fontSize: '0.78rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#CBD5E1'
                  e.currentTarget.style.color = '#0F172A'
                  e.currentTarget.style.background = '#F8FAFC'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E2E8F0'
                  e.currentTarget.style.color = '#475569'
                  e.currentTarget.style.background = '#FFFFFF'
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* ══════════════════════════════════════════════════════════════
          4. RIGHT SIDEBAR: Document Context Panel
         ══════════════════════════════════════════════════════════════ */}
      <aside
        style={{
          width: 320,
          minWidth: 320,
          background: '#FFFFFF',
          borderLeft: '1px solid #E5E7EB',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflowY: 'auto',
          padding: '1.25rem',
          gap: '1.25rem',
        }}
      >
        {/* ── Mini PDF Viewer Card ── */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0F172A' }}>
              Mini PDF viewer
            </span>
            <button
              onClick={() => setShowFullDocModal(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: '0.2rem' }}
              title="Expand full view"
            >
              <Maximize2 size={15} />
            </button>
          </div>

          {/* 3 Page Thumbnails */}
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'space-between' }}>
            {[1, 2, 3].map((p) => {
              const isPActive = activePage === p
              return (
                <div
                  key={p}
                  onClick={() => setActivePage(p)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}
                >
                  {/* Miniature Page Sheet */}
                  <div
                    style={{
                      width: '100%',
                      height: 100,
                      background: '#F8FAFC',
                      border: isPActive ? '2px solid #4F46E5' : '1px solid #CBD5E1',
                      borderRadius: '6px',
                      padding: '0.4rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      overflow: 'hidden',
                      boxShadow: isPActive ? '0 2px 8px rgba(79, 70, 229, 0.15)' : 'none',
                    }}
                  >
                    <div style={{ height: 4, background: '#CBD5E1', borderRadius: '2px', width: '80%' }} />
                    <div style={{ height: 3, background: '#E2E8F0', borderRadius: '2px', width: '95%' }} />
                    <div style={{ height: 3, background: '#E2E8F0', borderRadius: '2px', width: '90%' }} />
                    <div style={{ height: 3, background: '#E2E8F0', borderRadius: '2px', width: '85%' }} />
                    <div style={{ height: 3, background: isPActive ? '#A5B4FC' : '#E2E8F0', borderRadius: '2px', width: '70%' }} />
                    <div style={{ height: 3, background: isPActive ? '#A5B4FC' : '#E2E8F0', borderRadius: '2px', width: '60%' }} />
                    <div style={{ height: 3, background: '#E2E8F0', borderRadius: '2px', width: '90%' }} />
                  </div>
                  {/* Page number badge */}
                  <span
                    style={{
                      marginTop: '0.35rem',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: isPActive ? '#4F46E5' : '#64748B',
                    }}
                  >
                    {p}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Table of Contents ── */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '1rem',
          }}
        >
          <div
            onClick={() => setTocOpen(!tocOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              marginBottom: tocOpen ? '0.75rem' : 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.85rem', color: '#0F172A' }}>
              <ChevronDown size={16} color="#64748B" style={{ transform: tocOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.15s ease' }} />
              <span>Table of Contents</span>
            </div>
          </div>

          {tocOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem' }}>
              {[
                { title: 'Introduction & Profile', query: 'What is the candidate introduction and career profile?' },
                { title: 'Skills & Tech Stack', query: 'List all technical skills and programming languages.' },
                { title: 'Education & Academics', query: 'What is the education history and college CGPA?' },
                { title: 'Projects & Implementations', query: 'Explain the projects mentioned in the document.' },
                { title: 'Experience & Internships', query: 'What work experience and internships are listed?' },
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(item.query)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.35rem 0.5rem',
                    background: 'none',
                    border: 'none',
                    color: '#475569',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    borderRadius: '6px',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#F8FAFC'
                    e.currentTarget.style.color = '#4F46E5'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'none'
                    e.currentTarget.style.color = '#475569'
                  }}
                >
                  <ChevronRight size={13} color="#94A3B8" />
                  <span>{item.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Highlighted Grounded Passages ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div
            style={{
              background: '#EEF2FF',
              border: '1px solid #E0E7FF',
              borderRadius: '12px',
              padding: '0.9rem',
              fontSize: '0.78rem',
              color: '#334155',
              lineHeight: 1.55,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '0.7rem', color: '#4F46E5', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
              Cited Passage (Page 1)
            </div>
            {activeDoc?.extracted_text?.slice(0, 240) ||
              'Artificial Intelligence and Data Science student with strong interest in Data Science and Machine Learning. Skilled in data analysis, problem-solving, and developing automation tools.'}
          </div>

          <div
            style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '0.9rem',
              fontSize: '0.78rem',
              color: '#334155',
              lineHeight: 1.55,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
              Document Overview
            </div>
            <div><strong>File:</strong> {activeDoc?.filename || 'Resume.pdf'}</div>
            <div><strong>Status:</strong> Processed & Vectorized</div>
            <div><strong>Total Chunks:</strong> {activeDoc?.chunks_count || docChunks.length || 2} indexed</div>
          </div>
        </div>
      </aside>

      {/* ── Modal for full document raw content ── */}
      {showFullDocModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '2rem',
          }}
          onClick={() => setShowFullDocModal(false)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: 750,
              width: '100%',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={18} color="#4F46E5" />
                <span style={{ fontWeight: 700, fontSize: '1rem', color: '#0F172A' }}>
                  {activeDoc?.filename}
                </span>
              </div>
              <button
                onClick={() => setShowFullDocModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
              <div
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '1.25rem',
                  fontSize: '0.85rem',
                  lineHeight: 1.7,
                  color: '#1E293B',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {activeDoc?.extracted_text || 'No text extracted.'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
