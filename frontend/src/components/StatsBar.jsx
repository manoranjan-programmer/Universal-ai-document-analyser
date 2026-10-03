import React from 'react'

const STAT_CONFIG = [
  { key: 'total_documents',     label: 'Total Documents', icon: '📁', color: 'var(--accent-primary)' },
  { key: 'processed_documents', label: 'Processed',       icon: '✅', color: 'var(--success)' },
  { key: 'failed_documents',    label: 'Failed',          icon: '❌', color: 'var(--error)' },
  { key: 'total_chunks',        label: 'Indexed Chunks',  icon: '🔷', color: 'var(--accent-secondary)' },
]

export default function StatsBar({ stats = {} }) {
  return (
    <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
      {STAT_CONFIG.map(({ key, label, icon, color }) => (
        <div
          key={key}
          className="glass-card"
          style={{
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
            background: 'var(--bg-card)',
          }}
        >
          <div style={{ fontSize: '1.6rem' }}>{icon}</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color, lineHeight: 1 }}>
            {stats[key] ?? 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            {label}
          </div>
        </div>
      ))}
    </div>
  )
}
