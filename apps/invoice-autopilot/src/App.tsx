import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from './store/useStore'
import { Hero } from './components/Hero'
import { MagicStrip, FieldsWeRead, IntegrationWall, TrustRail } from './components/Sections'
import { DocStack } from './components/DocStack'
import { DocCanvas } from './components/DocCanvas'
import { ExtractionCard } from './components/ExtractionCard'
import {
  SavedCounter,
  Ledger,
  DigestCard,
  BeforeAfterPanel,
  DemoBanner,
  DocProgress,
} from './components/Dashboard'
import { RoiCalculator } from './components/RoiCalculator'
import { Gloss } from './components/Gloss'
import { IconBolt, IconCheckCircle, IconRefresh } from './components/icons'

function Nav() {
  return (
    <header className="nav">
      <a className="brand" href="#top">
        <span className="logo">
          <IconBolt size={20} />
        </span>
        <div>
          <h1>InvoiceAutopilot</h1>
        </div>
      </a>
      <nav className="nav-links">
        <a href="#how">How it works</a>
        <a href="#fields">Fields</a>
        <a href="#demo">Live demo</a>
        <a href="#roi">ROI Calculator</a>
        <a href="#trust">Security</a>
      </nav>
      <a className="btn btn-primary btn-sm" href="#demo">
        Try it free
      </a>
    </header>
  )
}

function DemoSection() {
  const reset = useStore((s) => s.reset)
  return (
    <section className="band band-surface" id="demo">
      <div className="section-head">
        <span className="overline">Live demo · Interactive Presets &amp; Verification</span>
        <h2 className="section-title">Watch it work — test clean, duplicate, missing, and typo presets.</h2>
        <p className="section-sub">
          Test clean invoices, duplicate protection with visual diff, missing mandatory VAT IDs, and line sum anomalies.
        </p>
      </div>

      <div className="demo-shell">
        <div className="demo-bar">
          <span
            className="env-chip"
            title="This demo uses European invoices: prices in euros, with VAT (sales tax) and the EU e-invoicing networks."
          >
            <span className="dot" /> Europe · EUR · VAT
            <Gloss k="vat" />
          </span>
          <DocProgress />
          <button className="btn btn-ghost btn-sm" onClick={reset} aria-label="Start over from the beginning">
            <IconRefresh size={14} /> Start over
          </button>
        </div>

        <main className="stage">
          <div className="stage-cell">
            <DocStack />
          </div>
          <div className="stage-cell">
            <DocCanvas />
          </div>
          <div className="stage-cell">
            <ExtractionCard />
          </div>
        </main>

        <div className="dash">
          <SavedCounter />
          <div className="dash-grid">
            <Ledger />
            <div className="dash-col">
              <DigestCard />
              <BeforeAfterPanel />
            </div>
          </div>
        </div>

        <div id="roi" style={{ marginTop: 24 }}>
          <RoiCalculator initialMonthlyVolume={250} initialHourlyWageEur={45} />
        </div>

        <DemoBanner />
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="foot">
      <div className="foot-inner">
        <div>
          <span className="overline">
            <IconBolt size={12} /> InvoiceAutopilot
          </span>
          <p className="foot-note" style={{ margin: '4px 0 0 0' }}>
            A portfolio demo · React · Framer Motion · deterministic engine
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', fontSize: '13px' }}>
          <a href="https://m1hamuha.github.io/portfolio/" target="_blank" rel="noreferrer" style={{ color: 'var(--text)', textDecoration: 'none', fontWeight: 600 }}>
            ← Central Portfolio Hub
          </a>
          <span style={{ color: 'var(--border)' }}>·</span>
          <a href="https://github.com/m1hamuha/portfolio_10_out_of_10" target="_blank" rel="noreferrer" style={{ color: 'var(--muted)', textDecoration: 'none' }}>
            GitHub Repository
          </a>
          <span style={{ color: 'var(--border)' }}>·</span>
          <a href="https://m1hamuha.github.io/portfolio/marginpulse/" target="_blank" rel="noreferrer" style={{ color: 'var(--muted)', textDecoration: 'none' }}>
            MarginPulse
          </a>
          <span style={{ color: 'var(--border)' }}>·</span>
          <a href="https://m1hamuha.github.io/portfolio/slotsaver/" target="_blank" rel="noreferrer" style={{ color: 'var(--muted)', textDecoration: 'none' }}>
            SlotSaver
          </a>
        </div>
      </div>
    </footer>
  )
}

function Toast() {
  const toast = useStore((s) => s.toast)
  const clear = useStore((s) => s.clearToast)
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(clear, 3400)
    return () => clearTimeout(t)
  }, [toast, clear])
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          className="toast"
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 26 }}
        >
          <span className="toast-ico">
            <IconCheckCircle size={18} />
          </span>
          <div>
            <div className="toast-title">{toast.title}</div>
            <div className="toast-sub">{toast.sub}</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function App() {
  const seed = useStore((s) => s.seed)
  // Pre-populate so a cold visitor never sees €0 / 0 sec / an empty box.
  useEffect(() => {
    seed()
  }, [seed])

  return (
    <div className="page" id="top">
      <Nav />
      <Hero />
      <MagicStrip />
      <FieldsWeRead />
      <DemoSection />
      <IntegrationWall />
      <TrustRail />
      <Footer />
      <Toast />
    </div>
  )
}
