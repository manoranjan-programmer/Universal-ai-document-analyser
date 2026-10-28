import React from 'react'

export default function SuggestedPrompts({ onSelectPrompt }) {
  const prompts = [
    { label: 'Summarize this document', query: 'Please summarize this document with key highlights and takeaways.' },
    { label: 'Extract key information', query: 'Extract the key information, candidate details, skills, and qualifications.' },
    { label: 'Find important sections', query: 'What are the most important sections, roles, and project achievements?' },
    { label: 'Identify missing information', query: 'Are there any potential gaps or missing details in this document?' },
    { label: 'Explain this document', query: 'Explain what this document is about and what its main purpose is.' },
    { label: 'Ask anything about this document', query: 'What are the top 3 strengths or notable highlights of this document?' },
  ]

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.5rem',
        marginTop: '0.85rem',
      }}
    >
      {prompts.map((p, idx) => (
        <button
          key={idx}
          type="button"
          onClick={() => onSelectPrompt?.(p.query)}
          className="prompt-chip"
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}
