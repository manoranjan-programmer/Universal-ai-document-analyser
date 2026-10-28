import React from 'react'

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'primary', trend }) {
  const colorMap = {
    primary: {
      bg: 'var(--primary-light)',
      border: 'var(--primary-subtle)',
      text: 'var(--primary)',
    },
    blue: {
      bg: 'var(--blue-light)',
      border: '#BFDBFE',
      text: 'var(--blue)',
    },
    success: {
      bg: 'var(--success-light)',
      border: 'var(--success-border)',
      text: 'var(--success)',
    },
    violet: {
      bg: 'var(--violet-light)',
      border: '#DDD6FE',
      text: 'var(--violet)',
    },
    warning: {
      bg: 'var(--warning-light)',
      border: 'var(--warning-border)',
      text: 'var(--warning)',
    },
  }

  const theme = colorMap[color] || colorMap.primary

  return (
    <div
      className="card"
      style={{
        padding: '1.25rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {title}
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem', letterSpacing: '-0.03em' }}>
            {value}
          </div>
        </div>

        {Icon && (
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-md)',
              background: theme.bg,
              border: `1px solid ${theme.border}`,
              color: theme.text,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon size={22} />
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.775rem', color: 'var(--text-muted)' }}>
          {trend && (
            <span style={{ fontWeight: 600, color: trend.positive ? 'var(--success)' : 'var(--text-muted)' }}>
              {trend.text}
            </span>
          )}
          {subtitle && <span>{subtitle}</span>}
        </div>
      )}
    </div>
  )
}
