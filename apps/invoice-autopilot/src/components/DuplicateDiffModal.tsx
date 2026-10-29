import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { DuplicateDetectionResult, Extraction, LedgerEntry } from '../engine/types'
import { IconAlert, IconCheckCircle, IconShield } from './icons'

export interface DuplicateDiffModalProps {
  isOpen: boolean
  onClose: () => void
  incoming: Extraction
  existing?: Extraction | LedgerEntry | null
  detectionResult: DuplicateDetectionResult
  onRejectDuplicate: () => void
  onForceApprove: (reason: string) => void
}

export function DuplicateDiffModal({
  isOpen,
  onClose,
  incoming,
  detectionResult,
  onRejectDuplicate,
  onForceApprove,
}: DuplicateDiffModalProps) {
  const [overrideReason, setOverrideReason] = useState('')
  const [showOverrideInput, setShowOverrideInput] = useState(false)

  if (!isOpen) return null

  const isExact = detectionResult.matchType === 'EXACT'

  return (
    <AnimatePresence>
      <div className="diff-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
        <motion.div
          className="diff-modal-shell"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header */}
          <div className="diff-modal-head">
            <div className="diff-head-title">
              <span className={`diff-icon-badge ${isExact ? 'danger' : 'warn'}`}>
                <IconAlert size={20} />
              </span>
              <div>
                <h2>{isExact ? 'Exact Duplicate Invoice Detected' : 'Potential Duplicate Warning'}</h2>
                <p>
                  Matched with existing record ({Math.round(detectionResult.confidence * 100)}% match confidence)
                </p>
              </div>
            </div>
            <button className="btn-close" onClick={onClose} aria-label="Close dialog">✕</button>
          </div>

          {/* Advice Banner */}
          <div className={`diff-advice-banner ${isExact ? 'danger' : 'warn'}`}>
            <IconShield size={16} />
            <span>{detectionResult.remediationAdvice}</span>
          </div>

          {/* Side-by-Side Comparison Grid */}
          <div className="diff-grid-container">
            <div className="diff-grid-header">
              <span className="diff-col-title incoming">Incoming Document ({incoming.docId})</span>
              <span className="diff-col-title status">Match Status</span>
              <span className="diff-col-title existing">
                Existing System Record ({detectionResult.matchedWithDocId ?? 'Filed'})
              </span>
            </div>

            <div className="diff-grid-body">
              {detectionResult.fields.map((field) => (
                <div
                  key={field.field}
                  className={`diff-row ${field.isMatch ? 'matched' : 'divergent'}`}
                >
                  <div className="diff-cell incoming">
                    <span className="diff-field-label">{field.label}</span>
                    <span className="diff-field-value num">{String(field.incomingValue)}</span>
                  </div>
                  <div className="diff-cell status">
                    {field.isMatch ? (
                      <span className="badge-match ok">
                        <IconCheckCircle size={14} /> Identical
                      </span>
                    ) : (
                      <span className="badge-match divergent">
                        <IconAlert size={14} /> Divergent
                      </span>
                    )}
                  </div>
                  <div className="diff-cell existing">
                    <span className="diff-field-label">{field.label}</span>
                    <span className="diff-field-value num">{String(field.existingValue)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Manager Override Section */}
          {showOverrideInput ? (
            <div className="diff-override-form">
              <label htmlFor="override-reason">
                <b>Manager Override Authorization:</b> Enter justification to proceed with posting duplicate:
              </label>
              <input
                id="override-reason"
                type="text"
                className="input-text"
                placeholder="e.g. Valid separate contract renewal, verified with supplier accounting"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                autoFocus
              />
            </div>
          ) : null}

          {/* Actions */}
          <div className="diff-modal-actions">
            <button className="btn btn-ghost" onClick={onClose}>
              Cancel Review
            </button>
            <button className="btn btn-danger" onClick={onRejectDuplicate}>
              Reject & Mark as Duplicate
            </button>
            {!showOverrideInput ? (
              <button
                className="btn btn-warn"
                onClick={() => setShowOverrideInput(true)}
              >
                Manager Override…
              </button>
            ) : (
              <button
                className="btn btn-primary"
                disabled={overrideReason.trim().length < 5}
                onClick={() => onForceApprove(overrideReason)}
              >
                Confirm Override & Post
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
