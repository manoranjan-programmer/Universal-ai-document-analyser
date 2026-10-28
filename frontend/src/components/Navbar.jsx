import React from 'react'
import { Sparkles, Search, Menu, Bell, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Navbar({ onMenuToggle, activeDocName }) {
  const navigate = useNavigate()

  return (
    <header
      style={{
        height: '60px',
        minHeight: '60px',
        background: '#FFFFFF',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      {/* Left: Mobile hamburger + Minimal Logo + App Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <button
          onClick={onMenuToggle}
          className="btn btn-ghost"
          style={{ padding: '0.4rem', display: 'none' }}
          id="mobile-nav-toggle"
          aria-label="Toggle navigation"
        >
          <Menu size={18} color="#000000" />
        </button>

        <div
          onClick={() => navigate('/')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: '8px',
              background: '#000000',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={16} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
              <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#000000', letterSpacing: '-0.02em' }}>
                Universal AI
              </span>
              <span style={{ fontSize: '0.72rem', color: '#666666', fontWeight: 500 }}>
                Document Analyser
              </span>
            </div>
          </div>
        </div>

        {activeDocName && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              marginLeft: '1rem',
              paddingLeft: '1rem',
              borderLeft: '1px solid var(--border)',
            }}
            className="hide-mobile"
          >
            <span style={{ fontSize: '0.78rem', color: '#666666' }}>Active:</span>
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#000000',
                maxWidth: 200,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {activeDocName}
            </span>
          </div>
        )}
      </div>

      {/* Right: Search, System Status, User Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={() => navigate('/documents')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#666666',
            padding: '0.35rem',
            display: 'flex',
            alignItems: 'center',
          }}
          title="Search documents"
        >
          <Search size={18} />
        </button>

        {/* Ready status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.75rem',
            color: '#666666',
            fontWeight: 500,
          }}
          className="hide-mobile"
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: '#000000',
              display: 'inline-block',
            }}
          />
          <span>Ready to analyse</span>
        </div>

        {/* User profile avatar */}
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: '#000000',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Universal AI User"
        >
          U
        </div>
      </div>
    </header>
  )
}
