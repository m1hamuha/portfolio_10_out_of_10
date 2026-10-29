import { useState } from 'react'
import { IconCheck, IconDownload } from './icons'

export function N8nWorkflowDownload() {
  const [copied, setCopied] = useState(false)

  const downloadJson = async () => {
    try {
      const res = await fetch('/n8n/slotsaver-cancellation-autofill.json')
      const text = await res.text()
      const blob = new Blob([text], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'slotsaver-cancellation-autofill.json'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      // Fallback direct download
      window.open('/n8n/slotsaver-cancellation-autofill.json', '_blank')
    }
  }

  const copyJson = async () => {
    try {
      const res = await fetch('/n8n/slotsaver-cancellation-autofill.json')
      const text = await res.text()
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  const nodes = [
    '1. Webhook Trigger',
    '2. Sanitize Payload',
    '3. Fetch Waitlist',
    '4. 4-Factor Ranker',
    '5. Twilio SMS',
    '6. 10m Waiter',
    '7. Evaluate Switch',
    '8. Calendar API',
    '9. Telegram Alert',
  ]

  return (
    <div
      className="card n8n-workflow-card"
      style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95))',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        padding: 20,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                background: 'rgba(234, 88, 12, 0.2)',
                color: '#fb923c',
                padding: '2px 8px',
                borderRadius: 4,
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              Production Asset
            </span>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>Self-Hostable Automation</span>
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 800, margin: '6px 0 2px', color: '#f8fafc' }}>
            9-Node n8n Autofill Workflow
          </h3>
          <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, maxWidth: 480 }}>
            Self-contained n8n workflow definition with webhook intake, Twilio SMS cascading, 10-minute timeout state machine, and Telegram owner alerts.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn btn-sm btn-ghost" onClick={copyJson} style={{ fontSize: 12 }}>
            {copied ? <><IconCheck size={14} /> Copied</> : 'Copy Workflow JSON'}
          </button>
          <button className="btn btn-sm btn-primary" onClick={downloadJson} style={{ fontSize: 12 }}>
            <IconDownload size={14} /> Download (.json)
          </button>
        </div>
      </div>

      {/* 9-Node Architecture Pipeline Flow */}
      <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#64748b', fontWeight: 600, marginBottom: 8 }}>
          Pipeline Nodes Sequence:
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {nodes.map((node) => (
            <span
              key={node}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                padding: '3px 8px',
                borderRadius: 4,
                fontSize: 10,
                color: '#cbd5e1',
                fontFamily: 'monospace',
              }}
            >
              {node}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
