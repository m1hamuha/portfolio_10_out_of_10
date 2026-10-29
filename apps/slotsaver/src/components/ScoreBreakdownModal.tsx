import { motion, AnimatePresence } from 'framer-motion'
import type { Candidate, Slot } from '../engine/types'
import { SCORING_WEIGHTS } from '../engine/priorityQueue'
import { IconCheckCircle } from './icons'

interface ScoreBreakdownModalProps {
  candidate: Candidate | null
  slot: Slot | null
  isOpen: boolean
  onClose: () => void
}

export function ScoreBreakdownModal({
  candidate,
  slot,
  isOpen,
  onClose,
}: ScoreBreakdownModalProps) {
  if (!isOpen || !candidate) return null

  const breakdown = candidate.scoreBreakdown ?? {
    serviceMatch: 35,
    availabilityFit: 25,
    historicalLtv: 20,
    responseSpeed: 15,
    total: candidate.fitScore,
    serviceMatchDetails: `Service category alignment: ${candidate.wantsService}`,
    availabilityDetails: `${candidate.flexibility} schedule flexibility`,
    ltvDetails: `${candidate.loyalty} tier client value history`,
    responseSpeedDetails: 'Historical response under 3 minutes',
  }

  const factors = [
    {
      title: 'Service Match',
      weight: SCORING_WEIGHTS.serviceMatch,
      score: breakdown.serviceMatch,
      details: breakdown.serviceMatchDetails,
      color: '#38bdf8', // sky
    },
    {
      title: 'Availability Fit',
      weight: SCORING_WEIGHTS.availabilityFit,
      score: breakdown.availabilityFit,
      details: breakdown.availabilityDetails,
      color: '#34d399', // emerald
    },
    {
      title: 'Loyalty & LTV',
      weight: SCORING_WEIGHTS.historicalLtv,
      score: breakdown.historicalLtv,
      details: breakdown.ltvDetails,
      color: '#fbbf24', // amber
    },
    {
      title: 'Response Speed',
      weight: SCORING_WEIGHTS.responseSpeed,
      score: breakdown.responseSpeed,
      details: breakdown.responseSpeedDetails,
      color: '#a78bfa', // purple
    },
  ]

  return (
    <AnimatePresence>
      <div
        className="modal-backdrop"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 16,
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="card"
          style={{
            maxWidth: 540,
            width: '100%',
            background: 'var(--color-surface, #1e293b)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 12,
            padding: 24,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
            color: '#f8fafc',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Priority Queue Attribution
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, margin: '4px 0 0' }}>
                {candidate.name}
              </h3>
              <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>
                Targeting: <b>{slot?.service ?? candidate.wantsService}</b> · Wants: <b>{candidate.wantsService}</b>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: breakdown.total >= 80 ? '#34d399' : '#fbbf24',
                  lineHeight: 1,
                }}
              >
                {breakdown.total}
                <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>/100</span>
              </div>
              <span style={{ fontSize: 10, textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600 }}>
                Composite Fit
              </span>
            </div>
          </div>

          {/* 4 Factor Bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
            {factors.map((f) => {
              const pct = Math.round((f.score / f.weight) * 100)
              return (
                <div key={f.title} style={{ background: 'rgba(0,0,0,0.2)', padding: '10px 14px', borderRadius: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>{f.title}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: f.color }}>
                      {f.score} / {f.weight} pts
                    </span>
                  </div>
                  {/* Progress Bar */}
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: f.color,
                        borderRadius: 3,
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{f.details}</div>
                </div>
              )
            })}
          </div>

          {/* Transparent Formula Explain Note */}
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              fontSize: 11,
              color: '#cbd5e1',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <IconCheckCircle size={15} />
            <span>
              <b>Transparent Queue:</b> Highest combined score receives the SMS offer first. On decline or timeout, offers cascade sequentially down the list.
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary btn-sm" onClick={onClose}>
              Close Inspector
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
