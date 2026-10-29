import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../store/useStore'
import { type Candidate } from '../engine'
import { IconUsers, IconHeart, IconBolt } from './icons'
import { Gloss } from './Gloss'

// Shows the consented waitlist ranked by fit-score during the cascade.
// The candidate currently being offered the slot is highlighted; ones who
// passed are dimmed; the accepter glows.

function fitBar(score: number) {
  return (
    <div className="fit-bar" aria-hidden="true">
      <span className="fit-fill" style={{ width: `${score}%` }} />
    </div>
  )
}

function CandidateRow({
  c,
  rank,
  state,
  onInspect,
}: {
  c: Candidate
  rank: number
  state: 'pending' | 'active' | 'passed' | 'accepted'
  onInspect: () => void
}) {
  return (
    <motion.li
      className={`cand cand-${state}`}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      onClick={onInspect}
      style={{ cursor: 'pointer' }}
      title="Click to inspect 4-factor scoring breakdown"
    >
      <span className="cand-rank">{rank}</span>
      <span className="cand-avatar">{c.name.slice(0, 1)}</span>
      <div className="cand-main">
        <div className="cand-line1">
          <span className="cand-name">{c.name}</span>
          <span className="cand-score"><span className="num">{c.fitScore}</span><span className="cand-score-cap">fit</span></span>
        </div>
        {fitBar(c.fitScore)}
        <div className="cand-tags">
          <span className="ctag"><IconHeart size={10} /> {c.loyalty}</span>
          <span className="ctag"><IconBolt size={10} /> {c.flexibility} flex</span>
          <span className="ctag ctag-svc">{c.wantsService}</span>
        </div>
      </div>
      {state === 'accepted' && <span className="cand-badge cand-badge-yes">Took it</span>}
      {state === 'passed' && <span className="cand-badge cand-badge-no">Passed</span>}
      {state === 'active' && <span className="cand-badge cand-badge-active">Offered</span>}
    </motion.li>
  )
}

export function WaitlistRanker() {
  const phase = useStore((s) => s.phase)
  const ranked = useStore((s) => s.ranked)
  const stepIndex = useStore((s) => s.stepIndex)
  const attempts = useStore((s) => s.attempts)
  const waitlistCount = useStore((s) => s.store.waitlist.length)
  const openScoreModal = useStore((s) => s.openScoreModal)

  const showing = phase !== 'idle' && ranked.length > 0

  function stateFor(c: Candidate, idx: number): 'pending' | 'active' | 'passed' | 'accepted' {
    const attemptIdx = attempts.findIndex((a) => a.candidateId === c.id)
    if (attemptIdx === -1) return 'pending'
    if ((phase === 'saved') && attempts[attemptIdx].accepted) return 'accepted'
    if (attemptIdx < stepIndex) return 'passed'
    if (attemptIdx === stepIndex && (phase === 'offering' || phase === 'expired' || phase === 'ranking')) return 'active'
    if (phase === 'saved' && !attempts[attemptIdx].accepted) return 'passed'
    if (phase === 'lost') return 'passed'
    return idx === 0 ? 'active' : 'pending'
  }

  return (
    <section className="ranker card" aria-label="Ranked waitlist">
      <header className="ranker-head">
        <span className="ranker-ico"><IconUsers size={16} /></span>
        <h3>Best matches<Gloss k="fitScore" /></h3>
        <span className="ranker-count">{ranked.length || waitlistCount} on the waitlist</span>
      </header>
      <AnimatePresence mode="popLayout">
        {showing ? (
          <motion.ol className="cand-list" key="list">
            {ranked.map((c, i) => (
              <CandidateRow
                c={c}
                rank={i + 1}
                state={stateFor(c, i)}
                onInspect={() => openScoreModal(c)}
                key={c.id}
              />
            ))}
          </motion.ol>
        ) : (
          <motion.div className="ranker-empty" key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p>Clients who opted in to be messaged when a chair opens up.</p>
            <p className="ranker-hint">Cancel a chair to see them ranked by fit.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
