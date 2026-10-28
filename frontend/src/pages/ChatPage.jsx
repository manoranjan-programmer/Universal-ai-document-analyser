import React from 'react'
import { useSearchParams } from 'react-router-dom'
import ChatInterface from '../components/ChatInterface'

export default function ChatPage() {
  const [searchParams] = useSearchParams()
  const documentId = searchParams.get('doc')

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
      <ChatInterface documentId={documentId} />
    </div>
  )
}
