import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  Plus,
  MessageSquare,
  FileText,
  Clock,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BarChart3,
} from 'lucide-react'

export default function Sidebar({
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapse,
  recentDocs = [],
  onSelectDoc,
  activeDocId,
  onNewAnalysis,
}) {
  const navigate = useNavigate()

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.3)',
            zIndex: 45,
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      <aside
        style={{
          width: isCollapsed ? '68px' : '250px',
          minWidth: isCollapsed ? '68px' : '250px',
          background: '#FFFFFF',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'width var(--transition-base), transform var(--transition-base)',
          zIndex: 50,
          position: 'relative',
        }}
        className={isOpen ? 'sidebar-mobile-open' : 'sidebar-desktop'}
      >
        <div style={{ padding: isCollapsed ? '1rem 0.5rem' : '1.25rem 1rem' }}>
          {/* "New Analysis" Button */}
          <button
            onClick={() => {
              onNewAnalysis?.()
              navigate('/')
              onClose?.()
            }}
            className="btn btn-black"
            style={{
              width: '100%',
              padding: isCollapsed ? '0.65rem' : '0.65rem 1rem',
              borderRadius: 'var(--radius-md)',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              marginBottom: '1.5rem',
            }}
            title="Start New Analysis"
          >
            <Plus size={16} />
            {!isCollapsed && <span>New Analysis</span>}
          </button>

          {/* Nav Items */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {[
              { to: '/', label: 'AI Assistant', icon: MessageSquare },
              { to: '/documents', label: 'Documents', icon: FileText },
              { to: '/analytics', label: 'Analytics', icon: BarChart3 },
              { to: '/settings', label: 'Settings', icon: Settings },
            ].map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: isCollapsed ? '0.65rem' : '0.6rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.85rem',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? '#000000' : 'var(--text-secondary)',
                    background: isActive ? 'var(--bg-subtle)' : 'transparent',
                    textDecoration: 'none',
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    transition: 'all var(--transition-fast)',
                  })}
                  title={item.label}
                >
                  <Icon size={17} color="#000000" />
                  {!isCollapsed && <span>{item.label}</span>}
                </NavLink>
              )
            })}
          </nav>

          {/* Recent Analyses list (when not collapsed) */}
          {!isCollapsed && recentDocs.length > 0 && (
            <div style={{ marginTop: '1.75rem' }}>
              <div
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  padding: '0 0.5rem 0.5rem',
                }}
              >
                Recent Analyses
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                {recentDocs.slice(0, 6).map((doc) => {
                  const isActive = activeDocId === doc.id
                  return (
                    <button
                      key={doc.id}
                      onClick={() => {
                        onSelectDoc?.(doc)
                        onClose?.()
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 0.65rem',
                        borderRadius: 'var(--radius-sm)',
                        border: 'none',
                        background: isActive ? 'var(--bg-subtle)' : 'transparent',
                        color: isActive ? '#000000' : 'var(--text-secondary)',
                        fontSize: '0.8rem',
                        fontWeight: isActive ? 600 : 400,
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: '100%',
                        transition: 'background var(--transition-fast)',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) e.currentTarget.style.background = 'var(--bg-secondary)'
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      <FileText size={14} color="#666666" style={{ flexShrink: 0 }} />
                      <span
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {doc.filename}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Footer: Desktop Collapse toggle */}
        <div
          style={{
            padding: isCollapsed ? '0.75rem 0.5rem' : '0.75rem 1rem',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
          }}
          className="hide-mobile"
        >
          {!isCollapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <span>AI Document Analyser</span>
            </div>
          )}

          <button
            onClick={onToggleCollapse}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              padding: '0.35rem',
              display: 'flex',
              alignItems: 'center',
              borderRadius: 'var(--radius-sm)',
            }}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </aside>
    </>
  )
}
