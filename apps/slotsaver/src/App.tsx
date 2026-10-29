import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useStore } from './store/useStore'
import { Schedule } from './components/Schedule'
import { WaitlistRanker } from './components/WaitlistRanker'
import { PhoneMock } from './components/PhoneMock'
import { RecoveredCounter, OwnerNotification, FillRateStat, FastForward } from './components/Widgets'
import { DemoBanner } from './components/DemoBanner'
import { HeroVisual } from './components/HeroVisual'
import { Calculator } from './components/Calculator'
import { Reveal } from './components/Reveal'
import { useCountUp } from './hooks/useCountUp'
import { formatEur } from './engine'
import { LiveEventLog } from './components/LiveEventLog'
import { ScoreBreakdownModal } from './components/ScoreBreakdownModal'
import { N8nWorkflowDownload } from './components/N8nWorkflowDownload'
import { RevenueRecoveryMetrics } from './components/RevenueRecoveryMetrics'
import {
  IconLeaf, IconRefresh, IconScissors, IconArrowRight, IconClock,
  IconMessage, IconCheck, IconBell, IconStar, IconLock, IconShield, IconCheckCircle,
} from './components/icons'

/* ============================== Nav ============================== */
function Nav() {
  return (
    <nav className="nav">
      <div className="wrap nav-inner">
        <a className="brand" href="#top" aria-label="SlotSaver home">
          <span className="brand-mark"><IconLeaf size={20} /></span>
          <span className="brand-name">SlotSaver</span>
        </a>
        <div className="nav-links">
          <a href="#how">How it works</a>
          <a href="#calculator">Your numbers</a>
          <a href="#proof">Results</a>
          <a href="#pricing">Pricing</a>
        </div>
        <div className="nav-right">
          <span className="nav-chip"><IconScissors size={13} /> Salons · clinics · EU</span>
          <a className="btn btn-primary btn-sm" href="#pricing">Start free</a>
        </div>
      </div>
    </nav>
  )
}

/* ============================== Hero ============================== */
function Hero() {
  const recovered = useStore((s) => s.store.recoveredThisMonthCents)
  const reduced = useStore((s) => s.reducedMotion)
  const display = useCountUp(recovered, reduced, 1200)

  return (
    <header className="hero" id="top">
      <div className="wrap hero-grid">
        <div className="hero-copy">
          <motion.span
            className="hero-eyebrow"
            initial={reduced ? false : { opacity: 0.001, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="dot" /><span>Booking-recovery on autopilot</span>
          </motion.span>

          <motion.h1
            initial={reduced ? false : { opacity: 0.001, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
          >
            A cancellation just <span className="hl">refilled itself.</span>
          </motion.h1>

          <motion.p
            className="hero-sub"
            initial={reduced ? false : { opacity: 0.001, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          >
            <strong>168 € of chair time</strong> was about to sit empty at 13:00. SlotSaver texted
            your waitlist, found the best match, and booked her in — <strong>you did nothing.</strong>
          </motion.p>

          <motion.div
            className="hero-stat"
            initial={reduced ? false : { opacity: 0.001, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          >
            <span className="hero-stat-num">{formatEur(display, { whole: true })}</span>
            <span className="hero-stat-cap">recovered this month<br />from cancelled slots</span>
          </motion.div>

          <motion.div
            className="hero-cta"
            initial={reduced ? false : { opacity: 0.001, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          >
            <a className="btn btn-primary btn-lg" href="#pricing">Start free <IconArrowRight size={16} /></a>
            <a className="btn btn-ghost btn-lg" href="#demo">Try the live demo</a>
            <span className="note"><IconCheck size={13} /> No card · from €45/mo</span>
          </motion.div>
        </div>

        <HeroVisual />
      </div>
    </header>
  )
}

/* ====================== 3-step recovery loop ====================== */
function Steps() {
  const steps = [
    {
      n: '1', icon: <IconScissors size={18} />, title: 'A chair cancels',
      body: 'A client drops a high-value appointment. That paid-for chair time is about to sit empty — SlotSaver catches it the second it frees up.',
      ui: (
        <>
          <div className="row"><span className="tt">13:00</span><span className="lbl">Balayage</span><span className="val val-red">Cancelled</span></div>
          <div className="row"><span className="dot dot-red" /><span className="lbl">168 € at risk</span></div>
        </>
      ),
    },
    {
      n: '2', icon: <IconMessage size={18} />, title: 'The right guest is texted',
      body: 'Your waitlist is ranked by fit, then the best match gets a one-tap SMS offer with a live countdown. If they pass, it cascades to the next — automatically, no phone tag.',
      ui: (
        <>
          <div className="row"><span className="dot dot-amber" /><span className="lbl">Amélie L. · 96 fit</span><span className="val">Offered</span></div>
          <div className="row"><span className="tt">SMS</span><span className="lbl">&ldquo;Want it? Reply Y&rdquo;</span></div>
        </>
      ),
    },
    {
      n: '3', icon: <IconBell size={18} />, title: 'Booked — you get pinged',
      body: 'She taps “Take it”, the chair turns green, your calendar updates, and you get one calm notification: chair saved, money recovered. That is the whole job.',
      ui: (
        <>
          <div className="row"><span className="dot dot-emerald" /><span className="lbl">Amélie L. booked in</span><span className="val val-emerald">+168 €</span></div>
          <div className="row"><span className="tt">13:00</span><span className="lbl">Balayage</span><span className="val val-emerald">Refilled</span></div>
        </>
      ),
    },
  ]
  return (
    <section className="section band band-surface" id="how">
      <div className="wrap">
        <Reveal className="section-head">
          <span className="overline">How it works</span>
          <h2>Cancel → auto-text the right guest → confirmed in one tap.</h2>
          <p>The same loop, every time, with real UI — an owner dashboard on one side, the guest&apos;s phone on the other. You stay out of it.</p>
        </Reveal>
        <div className="steps">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.06} className="step card">
              <div className="step-n">
                <span className="step-badge">{s.n}</span>
                <span className="step-ico">{s.icon}</span>
              </div>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
              <div className="step-ui">{s.ui}</div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ====================== No-show calculator ====================== */
function CalcSection() {
  return (
    <section className="section" id="calculator">
      <div className="wrap">
        <Reveal className="section-head">
          <span className="overline">Your numbers</span>
          <h2>How much empty chair time are you eating every month?</h2>
          <p>Most salons and clinics lose more to no-shows than they think. Move the sliders to your reality.</p>
        </Reveal>
        <Reveal><Calculator /></Reveal>
      </div>
    </section>
  )
}

/* ====================== Named-venue proof ====================== */
function Proof() {
  const venues = [
    { logo: 'BV', name: 'Bella Vista', loc: 'Salon · Lisbon', stat: '€2,100', line: 'recovered last month — 15 chairs refilled from the waitlist without a single phone call.' },
    { logo: 'KL', name: 'Klinik Nord', loc: 'Dermatology · Berlin', stat: '1.9%', line: 'no-show rate, down from 11% — gaps now refill themselves before the day starts.' },
    { logo: 'AT', name: 'Atelier Rue', loc: 'Hair studio · Paris', stat: '€640', line: 'in a slow week, recovered automatically. “It pays for itself the first cancellation.”' },
  ]
  return (
    <section className="section band band-surface" id="proof">
      <div className="wrap">
        <Reveal className="section-head">
          <span className="overline">Results</span>
          <h2>Real venues, refilling real chairs.</h2>
          <p>Profit, not admin. Every figure below is money that would otherwise have walked out the door.</p>
        </Reveal>
        <div className="proof-grid">
          {venues.map((v, i) => (
            <Reveal key={v.name} delay={i * 0.06} className="proof-card card">
              <div className="proof-venue">
                <span className="proof-logo">{v.logo}</span>
                <div>
                  <div className="proof-name">{v.name}</div>
                  <div className="proof-loc">{v.loc}</div>
                </div>
              </div>
              <div className="proof-stat num">{v.stat}</div>
              <p className="proof-line">{v.line}</p>
            </Reveal>
          ))}
        </div>
        <Reveal className="proof-bar">
          <span className="pb">
            <span className="stars" role="img" aria-label="4.9 out of 5 on G2">
              {[0, 1, 2, 3, 4].map((n) => <IconStar key={n} size={15} />)}
            </span>
            <span className="n">4.9</span> on G2
          </span>
          <span className="pb"><span className="n">320+</span> venues</span>
          <span className="pb"><span className="n">€1.2M</span> chair time recovered</span>
          <span className="pb"><IconShield size={15} /> GDPR · consented waitlist</span>
        </Reveal>
      </div>
    </section>
  )
}

/* ====================== Pricing + trust ====================== */
function Pricing() {
  return (
    <section className="section" id="pricing">
      <div className="wrap">
        <Reveal className="section-head">
          <span className="overline">Pricing</span>
          <h2>One flat price. It pays for itself on the first refill.</h2>
          <p>No setup fees, no per-message charges, no “contact sales” wall. Cancel anytime.</p>
        </Reveal>
        <div className="pricing-grid">
          <Reveal className="price-card card feat">
            <span className="overline price-eyebrow">Studio</span>
            <div className="price-amt"><span className="num">€45</span><span className="per">/ month</span></div>
            <p className="price-sub">Everything one location needs to stop losing money to cancellations.</p>
            <ul className="price-list">
              <li><IconCheck size={16} /> Unlimited automatic refills</li>
              <li><IconCheck size={16} /> SMS &amp; WhatsApp waitlist offers</li>
              <li><IconCheck size={16} /> Fit-ranked cascade — best guest first</li>
              <li><IconCheck size={16} /> Plugs into your existing booking system</li>
              <li><IconCheck size={16} /> Owner notifications + monthly recovered report</li>
            </ul>
            <div className="price-cta">
              <a className="btn btn-primary btn-lg" href="#demo">Start free — no card <IconArrowRight size={16} /></a>
            </div>
          </Reveal>

          <Reveal delay={0.06} className="trust-card card">
            <h3>Built for owners, not IT teams.</h3>
            <div className="trust-row">
              <span className="ico"><IconClock size={18} /></span>
              <div><div className="t">Live in a day</div><div className="d">We connect to your booking calendar — you do nothing technical.</div></div>
            </div>
            <div className="trust-row">
              <span className="ico"><IconLock size={18} /></span>
              <div><div className="t">GDPR-safe by design</div><div className="d">Only consented waitlist clients are ever messaged. EU-hosted.</div></div>
            </div>
            <div className="trust-row">
              <span className="ico"><IconCheckCircle size={18} /></span>
              <div><div className="t">Unlimited support</div><div className="d">Real humans, no bots, no tiers. Forget the phone tag for good.</div></div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

/* ====================== Live interactive demo ====================== */
// The big "Simulate a cancellation" control + live status line.
function ControlStrip() {
  const phase = useStore((s) => s.phase)
  const simulate = useStore((s) => s.simulateCancellation)
  const reset = useStore((s) => s.reset)
  const store = useStore((s) => s.store)
  const demoSlotId = useStore((s) => s.demoSlotId)
  const lastRecovered = useStore((s) => s.lastRecoveredCents)
  const slot = store.slots.find((s) => s.id === demoSlotId)

  const atRisk = slot ? formatEur(slot.priceCents, { whole: true }) : ''

  let status: { tone: string; text: string } | null = null
  if (phase === 'opening') status = { tone: 'risk', text: `Chair freed — ${atRisk} at risk` }
  else if (phase === 'ranking') status = { tone: 'work', text: 'Ranking your waitlist by fit…' }
  else if (phase === 'offering') status = { tone: 'work', text: 'Offer sent — waiting on a reply' }
  else if (phase === 'expired') status = { tone: 'work', text: 'No reply — cascading to the next match' }
  else if (phase === 'saved') status = { tone: 'ok', text: `Saved! +${formatEur(lastRecovered, { whole: true })} recovered` }
  else if (phase === 'lost') status = { tone: 'risk', text: 'No match took this one — honest miss' }

  return (
    <div className="control card">
      <div className="control-left">
        {phase === 'idle' ? (
          <>
            <div className="control-copy">
              <h3>A client just cancelled their {slot?.service.toLowerCase()}.</h3>
              <p>
                That&apos;s <strong className="num">{atRisk}</strong> of chair time about to sit empty at{' '}
                <strong>{slot?.time}</strong>. Watch SlotSaver refill it from the waitlist — you do nothing.
              </p>
            </div>
            <button className="btn btn-primary btn-lg" onClick={simulate}>
              Simulate a cancellation <IconArrowRight size={16} />
            </button>
            <p className="control-hint"><IconClock size={12} /> Or click any booked chair to cancel that one.</p>
          </>
        ) : (
          <>
            <div className={`control-status control-status-${status?.tone}`}>
              <span className="status-dot" />
              <span className="status-text">{status?.text}</span>
            </div>
            {(phase === 'saved' || phase === 'lost') && (
              <button className="btn btn-primary btn-lg" onClick={reset}>
                Run it again <IconRefresh size={15} />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function LiveDemo() {
  const events = useStore((s) => s.events)
  const clearEvents = useStore((s) => s.clearEvents)
  const store = useStore((s) => s.store)

  return (
    <section className="section band band-surface" id="demo">
      <div className="wrap">
        <Reveal className="section-head">
          <span className="overline overline-live">Live demo · sample data</span>
          <h2>See it run on a real salon&apos;s day.</h2>
          <p>Cancel a chair and watch the waitlist refill it in ~15 seconds — offer, cascade, confirm, recovered. Fully interactive.</p>
        </Reveal>

        <Reveal>
          <RevenueRecoveryMetrics
            recoveredCents={store.recoveredThisMonthCents}
            recoveredCount={store.recoveredCount}
            fillRatePct={store.fillRatePct}
          />
        </Reveal>

        <div className="demo-stage">
          <div className="demo-left">
            <ControlStrip />
            <Schedule />
          </div>
          <aside className="demo-right">
            <PhoneMock />
            <OwnerNotification />
            <WaitlistRanker />
          </aside>
        </div>

        <div className="demo-stage" style={{ marginTop: 20, gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)' }}>
          <RecoveredCounter />
          <FastForward />
        </div>
        <div style={{ marginTop: 20 }}><FillRateStat /></div>

        <div style={{ marginTop: 24 }}>
          <LiveEventLog events={events} onClear={clearEvents} />
        </div>

        <div style={{ marginTop: 24 }}>
          <N8nWorkflowDownload />
        </div>

        <div style={{ marginTop: 20 }}><DemoBanner /></div>
      </div>
    </section>
  )
}

/* ============================== App ============================== */
function useChoreography() {
  const phase = useStore((s) => s.phase)
  const reduced = useStore((s) => s.reducedMotion)

  useEffect(() => {
    if (reduced) return
    if (phase === 'opening') {
      const t = setTimeout(() => useStore.setState({ phase: 'ranking' }), 2000)
      return () => clearTimeout(t)
    }
    if (phase === 'ranking') {
      const t = setTimeout(() => useStore.getState().advanceCascade(), 1900)
      return () => clearTimeout(t)
    }
  }, [phase, reduced])

  useEffect(() => {
    if (reduced) return
    if (phase !== 'offering') return
    const iv = setInterval(() => useStore.getState().tickCountdown(), 1000)
    return () => clearInterval(iv)
  }, [phase, reduced])
}

export default function App() {
  const isScoreModalOpen = useStore((s) => s.isScoreModalOpen)
  const selectedCandidateForModal = useStore((s) => s.selectedCandidateForModal)
  const closeScoreModal = useStore((s) => s.closeScoreModal)
  const demoSlotId = useStore((s) => s.demoSlotId)
  const store = useStore((s) => s.store)
  const slot = store.slots.find((s) => s.id === demoSlotId) ?? null

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => useStore.getState().setReducedMotion(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  useChoreography()

  return (
    <div className="app">
      <div className="app-bg" aria-hidden="true" />
      <div className="app-inner">
        <Nav />
        <main>
          <Hero />
          <Steps />
          <CalcSection />
          <Proof />
          <Pricing />
          <LiveDemo />
        </main>
        <footer className="footer">
          <div className="wrap footer-inner">
            <div className="brand">
              <span className="brand-mark"><IconLeaf size={18} /></span>
              <span className="brand-name">SlotSaver</span>
            </div>
            <p className="footer-stack">
              Built with React · Framer Motion · a deterministic <span className="num">seeded</span> engine. Demo on sample data.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', fontSize: '13px', width: '100%', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid hsl(var(--border) / 0.3)' }}>
              <a href="https://m1hamuha.github.io/portfolio/" target="_blank" rel="noreferrer" style={{ color: 'hsl(var(--primary))', textDecoration: 'none', fontWeight: 600 }}>
                ← Central Portfolio Hub
              </a>
              <span style={{ color: 'hsl(var(--muted-foreground) / 0.5)' }}>·</span>
              <a href="https://github.com/m1hamuha/portfolio_10_out_of_10" target="_blank" rel="noreferrer" style={{ color: 'hsl(var(--muted-foreground))', textDecoration: 'none' }}>
                GitHub Repository
              </a>
              <span style={{ color: 'hsl(var(--muted-foreground) / 0.5)' }}>·</span>
              <a href="https://m1hamuha.github.io/portfolio/invoice-autopilot/" target="_blank" rel="noreferrer" style={{ color: 'hsl(var(--muted-foreground))', textDecoration: 'none' }}>
                InvoiceAutopilot
              </a>
              <span style={{ color: 'hsl(var(--muted-foreground) / 0.5)' }}>·</span>
              <a href="https://m1hamuha.github.io/portfolio/marginpulse/" target="_blank" rel="noreferrer" style={{ color: 'hsl(var(--muted-foreground))', textDecoration: 'none' }}>
                MarginPulse
              </a>
            </div>
          </div>
        </footer>
      </div>

      <ScoreBreakdownModal
        candidate={selectedCandidateForModal}
        slot={slot}
        isOpen={isScoreModalOpen}
        onClose={closeScoreModal}
      />
    </div>
  )
}
