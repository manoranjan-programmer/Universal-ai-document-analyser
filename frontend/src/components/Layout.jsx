import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import { fetchDocuments } from '../services/api'

export default function Layout({ children }) {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [recentDocs, setRecentDocs] = useState([])

  useEffect(() => {
    fetchDocuments()
      .then((data) => setRecentDocs(data.documents || []))
      .catch(() => {})
  }, [])

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
      <Navbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          recentDocs={recentDocs}
          onSelectDoc={(doc) => navigate(`/?doc=${doc.id}`)}
          onNewAnalysis={() => navigate('/')}
        />

        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '2rem 1.5rem',
            background: '#FFFFFF',
          }}
          className="animate-fade"
        >
          {children}
        </main>
      </div>
    </div>
  )
}
