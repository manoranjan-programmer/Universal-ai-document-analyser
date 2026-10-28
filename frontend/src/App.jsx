import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'
import DocumentsPage from './pages/DocumentsPage'
import SettingsPage from './pages/SettingsPage'
import AnalyticsPage from './pages/AnalyticsPage'
import MainWorkspace from './components/MainWorkspace'

// Helper component to redirect /document/:id to /?doc=:id
function DocumentRedirect() {
  const { id } = useParams()
  return <Navigate to={`/?doc=${id}`} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      {/* Strict Monochrome Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#000000',
            color: '#FFFFFF',
            border: '1px solid #000000',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            fontSize: '0.85rem',
            fontWeight: 500,
            borderRadius: '8px',
            padding: '10px 16px',
          },
          success: {
            iconTheme: {
              primary: '#FFFFFF',
              secondary: '#000000',
            },
          },
          error: {
            iconTheme: {
              primary: '#FFFFFF',
              secondary: '#000000',
            },
          },
        }}
      />

      <Routes>
        {/* Core AI Assistant Workspace */}
        <Route path="/" element={<MainWorkspace />} />
        <Route path="/chat" element={<MainWorkspace />} />

        {/* Document History / Recent Analyses */}
        <Route
          path="/documents"
          element={
            <Layout>
              <DocumentsPage />
            </Layout>
          }
        />

        {/* System Settings */}
        <Route
          path="/settings"
          element={
            <Layout>
              <SettingsPage />
            </Layout>
          }
        />

        {/* Business Analytics & ROI Intelligence */}
        <Route
          path="/analytics"
          element={
            <Layout>
              <AnalyticsPage />
            </Layout>
          }
        />
        <Route path="/dashboard" element={<Navigate to="/analytics" replace />} />

        {/* Direct document deep-link redirect */}
        <Route path="/document/:id" element={<DocumentRedirect />} />

        {/* Legacy route redirects */}
        <Route path="/analyzer" element={<Navigate to="/" replace />} />
        <Route path="/search" element={<Navigate to="/documents" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
