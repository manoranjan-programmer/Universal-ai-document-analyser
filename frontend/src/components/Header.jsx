import React from 'react'
import { Menu, Sparkles, HelpCircle, Bell, Search, ShieldCheck } from 'lucide-react'

export default function Header({ onMenuClick, title = 'Dashboard', subtitle }) {
  return (
    <header
      style={{
        height: '64px',
        background: 'var(--bg-header)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.75rem',
        position: 'sticky',
        top: 0,
        zIndex: 30,
      }}
    >
      {/* Left side: hamburger (mobile) & Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={onMenuClick}
          className="btn btn-ghost"
          style={{ padding: '0.4rem', display: 'none' }}
          id="mobile-menu-btn"
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} />
        </button>

        <div>
          <h1 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, lineHeight: 1.2 }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right side: RAG badge, search quickhint, notifications, user avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        {/* RAG Status Pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.3rem 0.75rem',
            background: 'var(--primary-light)',
            border: '1px solid var(--primary-subtle)',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--primary)',
          }}
          title="RAG engine ready with HuggingFace & FAISS"
        >
          <Sparkles size={13} />
          <span>Mistral-7B RAG</span>
        </div>

        {/* Verified Secure Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.3rem 0.65rem',
            background: 'var(--success-light)',
            border: '1px solid var(--success-border)',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.725rem',
            fontWeight: 600,
            color: '#065F46',
          }}
          className="hidden-mobile"
        >
          <ShieldCheck size={13} />
          <span>Local FAISS</span>
        </div>

        {/* User avatar / profile badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            paddingLeft: '0.5rem',
            borderLeft: '1px solid var(--border)',
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: 'var(--grad-primary)',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(79, 70, 229, 0.25)',
            }}
          >
            AI
          </div>
        </div>
      </div>
    </header>
  )
}
