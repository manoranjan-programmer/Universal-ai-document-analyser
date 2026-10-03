import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import AIWelcome from './AIWelcome'
import DocumentViewer from './DocumentViewer'
import ChatWindow from './ChatWindow'
import AnalysisPanel from './AnalysisPanel'
import {
  fetchDocuments,
  fetchDocumentChunks,
  askQuestion,
  uploadDocument,
} from '../services/api'

export default function MainWorkspace() {
  const navigate = useNavigate()
  const location = useLocation()

  // State: Documents & Active Selection
  const [documents, setDocuments] = useState([])
  const [activeDoc, setActiveDoc] = useState(null)
  const [activePage, setActivePage] = useState(1)
  const [docChunks, setDocChunks] = useState([])
  const [loadingDocs, setLoadingDocs] = useState(true)

  // Layout & Navigation State
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [rightPanelTab, setRightPanelTab] = useState('chat') // 'chat' or 'analysis'
  const [mobileSplitTab, setMobileSplitTab] = useState('chat') // 'preview' or 'chat' on mobile

  // Upload State
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('')

  // Chat State
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)

  const fileInputRef = useRef(null)

  // ── Load All Documents ──
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
      } else if (!activeDoc && docs.length > 0) {
        // If query param doesn't specify, default to first document
        setActiveDoc(docs[0])
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

  // ── Load Document Chunks when activeDoc changes ──
  useEffect(() => {
    if (activeDoc?.id) {
      fetchDocumentChunks(activeDoc.id, 60)
        .then((data) => setDocChunks(data.chunks || []))
        .catch(() => setDocChunks([]))
      setActivePage(1)
    } else {
      setDocChunks([])
    }
  }, [activeDoc?.id])

  // ── File Upload Handler ──
  const handleUploadFile = async (file) => {
    if (!file) return

    setUploading(true)
    setUploadProgress(15)
    setCurrentStep('Uploading document...')

    try {
      const p1 = setTimeout(() => {
        setUploadProgress(40)
        setCurrentStep('Extracting text & OCR...')
      }, 350)
      const p2 = setTimeout(() => {
        setUploadProgress(75)
        setCurrentStep('Understanding document structure...')
      }, 700)
      const p3 = setTimeout(() => {
        setUploadProgress(90)
        setCurrentStep('Generating vector embeddings & AI insights...')
      }, 1000)

      const res = await uploadDocument(file)

      clearTimeout(p1)
      clearTimeout(p2)
      clearTimeout(p3)

      setUploadProgress(100)
      setCurrentStep('Analysis complete!')

      if (res.success) {
        toast.success(`"${res.filename}" analysed successfully!`)
        const updated = await fetchDocuments()
        const newDocs = updated.documents || []
        setDocuments(newDocs)
        const found = newDocs.find((d) => d.id === res.document_id)
        if (found) {
          setActiveDoc(found)
        }
        setMessages([])
      } else {
        toast.error(res.error || 'Upload failed')
      }
    } catch (err) {
      toast.error(err.message || 'Upload failed')
    } finally {
      setTimeout(() => {
        setUploading(false)
        setUploadProgress(0)
        setCurrentStep('')
      }, 600)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // ── Chat Send Message Handler ──
  const handleSendMessage = async (queryText) => {
    const q = (queryText || input).trim()
    if (!q || chatLoading) return

    setInput('')
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: q,
      time: now,
    }

    setMessages((prev) => [...prev, userMsg])
    setChatLoading(true)

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
      setChatLoading(false)
    }
  }

  const handleResetChat = () => {
    setMessages([])
    toast.success('Started a fresh conversation')
  }

  const handleSelectDoc = (doc) => {
    setActiveDoc(doc)
    setMessages([])
  }

  const handleNewAnalysis = () => {
    setActiveDoc(null)
    setMessages([])
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        background: '#FFFFFF',
      }}
    >
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleUploadFile(file)
        }}
        accept=".pdf,.jpg,.jpeg,.png,.docx"
        style={{ display: 'none' }}
      />

      {/* Top Navbar */}
      <Navbar
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        activeDocName={activeDoc?.filename}
      />

      {/* Main Workspace Body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        {/* Collapsible Monochrome Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          recentDocs={documents}
          onSelectDoc={handleSelectDoc}
          activeDocId={activeDoc?.id}
          onNewAnalysis={handleNewAnalysis}
        />

        {/* Workspace Central Area */}
        <main
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            background: '#FFFFFF',
          }}
        >
          {!activeDoc ? (
            /* ══════════════════════════════════════════════════════════════
               HOME / NEW ANALYSIS SCREEN (AIWelcome)
               ══════════════════════════════════════════════════════════════ */
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem 1rem',
              }}
            >
              <AIWelcome
                onUpload={handleUploadFile}
                uploading={uploading}
                uploadProgress={uploadProgress}
                currentStep={currentStep}
                recentDocs={documents}
                onSelectDoc={handleSelectDoc}
              />
            </div>
          ) : (
            /* ══════════════════════════════════════════════════════════════
               SPLIT-SCREEN DOCUMENT ANALYSIS & AI ASSISTANT VIEW
               ══════════════════════════════════════════════════════════════ */
            <div
              style={{
                flex: 1,
                display: 'flex',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {/* Mobile Tab Switcher */}
              <div
                className="hide-desktop"
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 12,
                  zIndex: 20,
                  display: 'none', // Managed by responsive CSS if needed
                }}
              >
                <div style={{ display: 'flex', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', padding: '2px', border: '1px solid var(--border)' }}>
                  <button
                    onClick={() => setMobileSplitTab('preview')}
                    style={{
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.72rem',
                      border: 'none',
                      background: mobileSplitTab === 'preview' ? '#FFFFFF' : 'transparent',
                      fontWeight: mobileSplitTab === 'preview' ? 700 : 500,
                      borderRadius: '4px',
                    }}
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => setMobileSplitTab('chat')}
                    style={{
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.72rem',
                      border: 'none',
                      background: mobileSplitTab === 'chat' ? '#FFFFFF' : 'transparent',
                      fontWeight: mobileSplitTab === 'chat' ? 700 : 500,
                      borderRadius: '4px',
                    }}
                  >
                    Assistant
                  </button>
                </div>
              </div>

              {/* Left Column: Document Viewer (48% on desktop) */}
              <section
                style={{
                  flex: '0 0 46%',
                  maxWidth: '46%',
                  borderRight: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                }}
                className="viewer-column"
              >
                <DocumentViewer
                  doc={activeDoc}
                  chunks={docChunks}
                  activePage={activePage}
                  onPageChange={(p) => setActivePage(p)}
                />
              </section>

              {/* Right Column: AI Assistant & Analysis (54% on desktop) */}
              <section
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  minWidth: 0,
                }}
                className="chat-column"
              >
                {rightPanelTab === 'chat' ? (
                  <ChatWindow
                    doc={activeDoc}
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    onResetChat={handleResetChat}
                    loading={chatLoading}
                    input={input}
                    setInput={setInput}
                    onAttachClick={() => fileInputRef.current?.click()}
                    activeTab={rightPanelTab}
                    onTabChange={(tab) => setRightPanelTab(tab)}
                  />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    {/* Header to toggle back to chat */}
                    <div
                      style={{
                        padding: '0.75rem 1.25rem',
                        borderBottom: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <h3 style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0 }}>
                        Document Analysis Cards
                      </h3>
                      <button
                        onClick={() => setRightPanelTab('chat')}
                        className="btn btn-outline btn-sm"
                      >
                        Back to AI Chat
                      </button>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                      <AnalysisPanel doc={activeDoc} chunks={docChunks} />
                    </div>
                  </div>
                )}
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
