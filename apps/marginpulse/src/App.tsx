import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from './store/useStore'
import {
  formatEur,
  pct,
  sparkline,
  projectSavingsCents,
  findSku,
  storeWaterfall,
  summarizeCoverage,
  profitReportCsv,
  ALL_PRESETS,
  type Leak,
} from './engine'
import { AnimatedEuro, CountUpEuro, Reveal, Sparkline } from './components/widgets'
import { Waterfall } from './components/Waterfall'
import { LeakDrawer } from './components/LeakDrawer'
import { InteractiveWaterfall } from './components/InteractiveWaterfall'
import { SkuLedgerTable } from './components/SkuLedgerTable'
import { ExecutiveReportModal } from './components/ExecutiveReportModal'
import { BenchmarkBadge } from './components/BenchmarkBadge'
import {
  LeakIcon, IconBolt, IconPause, IconPlay, IconCheck, IconActivity, IconDownload,
  IconEuro, IconTrendDown, IconPercent, IconAlert, IconBell, IconSend, IconSparkles,
  IconFileText,
} from './components/icons'
import { ImportPanel } from './components/ImportPanel'

const TICK_MS = 1000
const SCALED_MS = 45_000 // demo time advanced per real second

function DemoBanner() {
  const mode = useStore((s) => s.mode)
  const store = useStore((s) => s.store)
  const coverage = useMemo(() => summarizeCoverage(store.skus), [store.skus])
  return (
    <div className="demobanner">
      <span className="dot" />
      {mode === 'imported' ? (
        <span>
          <b>{store.storeName}</b> — {store.skuCount} row{store.skuCount === 1 ? '' : 's'} · {coverage.scorePct}% cost coverage.
          {coverage.missing.length > 0 ? ` Missing costs are excluded, not estimated: ${coverage.missing.slice(0, 3).join(', ')}${coverage.missing.length > 3 ? '…' : ''}` : ' All core cost groups supplied.'}
        </span>
      ) : (
        <span><b>Interactive demo</b> — synthetic shop data. Upload your Shopify or Amazon exports to analyse your own numbers; nothing leaves your browser.</span>
      )}
    </div>
  )
}

function TopBar() {
  const saved = useStore((s) => s.derived.kpis.savedThisWeekCents)
  const skuCount = useStore((s) => s.store.skuCount)
  const storeName = useStore((s) => s.store.storeName)
  const store = useStore((s) => s.store)
  const mode = useStore((s) => s.mode)
  const openModal = useStore((s) => s.openModal)
  const benchmarkDurationMs = useStore((s) => s.benchmarkDurationMs)
  const setExecutiveReportOpen = useStore((s) => s.setExecutiveReportOpen)
  const channels = useMemo(() => [...new Set(store.skus.map((sku) => sku.channel).filter(Boolean))], [store.skus])

  const downloadReport = () => {
    const blob = new Blob([profitReportCsv(store.skus)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'marginpulse'}-profit-report.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }
  return (
    <div className="topbar">
      <div className="brand">
        <span className="logo"><IconBolt size={19} className="" /></span>
        <div>
          <h1>MarginPulse</h1>
          <div className="tag">Profit-leak control tower</div>
        </div>
      </div>
      <div className="store-chip">
        <span className="signal-dot" aria-hidden="true" />
        <b>{storeName}</b>
        <span className="mkts">{mode === 'imported' ? `· ${channels.join(' + ') || 'CSV'} · ${skuCount} row${skuCount === 1 ? '' : 's'}` : `· Sample data · ${skuCount} SKUs`}</span>
      </div>
      <div className="topbar-right">
        <BenchmarkBadge durationMs={benchmarkDurationMs} rowCount={store.skuCount} />
        <button className="btn" onClick={() => setExecutiveReportOpen(true)}>
          <IconFileText size={15} /> Executive Audit Report
        </button>
        {mode === 'imported' && (
          <button className="btn" onClick={downloadReport}>
            <IconDownload size={15} /> Download report
          </button>
        )}
        <button className="btn btn-accent" onClick={() => openModal('import')}>
          <IconActivity size={15} /> Analyse my store
        </button>
        {mode === 'demo' && (
          <div className="saved-pill">
            <IconShieldMini />
            <div>
              <div className="lbl">Modelled this week</div>
              <div className="val num"><AnimatedEuro valueCents={saved} /></div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
const IconShieldMini = () => <IconCheck size={18} />

function PresetBar() {
  const mode = useStore((s) => s.mode)
  const activePresetId = useStore((s) => s.activePresetId)
  const loadPresetBundle = useStore((s) => s.loadPresetBundle)
  const reset = useStore((s) => s.reset)

  return (
    <div
      className="preset-bar"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 24px',
        background: 'rgba(15, 23, 42, 0.75)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        overflowX: 'auto',
      }}
    >
      <span
        style={{
          fontSize: '11px',
          fontWeight: 700,
          color: '#94a3b8',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          whiteSpace: 'nowrap',
          marginRight: '4px',
        }}
      >
        Presets:
      </span>
      <button
        className={`btn btn-sm ${mode === 'demo' ? 'btn-primary' : 'btn-ghost'}`}
        onClick={reset}
        style={{ fontSize: '11px', padding: '4px 10px', height: '28px' }}
      >
        Synthetic Demo
      </button>
      {ALL_PRESETS.map((p) => {
        const isActive = mode === 'imported' && activePresetId === p.id
        return (
          <button
            key={p.id}
            className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => loadPresetBundle(p)}
            title={p.description}
            style={{ fontSize: '11px', padding: '4px 10px', height: '28px', whiteSpace: 'nowrap' }}
          >
            {p.badge} ({p.rowCount} rows)
          </button>
        )
      })}
    </div>
  )
}

/* Plain-English, jargon-free one-liner per leak type — so a non-expert gets it instantly. */
const LEAK_PLAIN: Record<string, string> = {
  BELOW_FLOOR: 'You’re selling this for less than it costs you',
  FEE_HIKE: 'The marketplace quietly raised its cut on this item',
  RETURN_SPIKE: 'Too many of these are coming back as returns',
  BUYBOX_LOST: 'A rival took the default “Buy” button, so sales dropped',
  STORAGE_FEE: 'Old stock is about to trigger an extra storage charge',
  PPC_BLEED: 'Ads on this item cost more than the item earns',
  VAT_MISMATCH: 'The wrong tax rate is being charged on this listing',
}

/* Short villain "cause" line for the hero cards. */
const LEAK_CAUSE: Record<string, string> = {
  BELOW_FLOOR: 'Repricer dropped below landed cost',
  FEE_HIKE: 'Referral + FBA eating the margin',
  RETURN_SPIKE: 'Return rate running 3× normal',
  BUYBOX_LOST: 'Lost the Buy Box to a rival',
  STORAGE_FEE: 'Aged stock nearing storage fees',
  PPC_BLEED: 'Ad spend above unit margin',
  VAT_MISMATCH: 'Wrong VAT rate over-charging',
}

const plainLeak = (leak: Leak) =>
  leak.type === 'BELOW_FLOOR' && leak.title.startsWith('Thin margin')
    ? 'Net margin is below the 8% review floor'
    : (LEAK_PLAIN[leak.type] ?? leak.detail)

/** Human severity wording for cold visitors. */
function sevLabel(sev: string) {
  return sev === 'high' ? 'urgent' : sev === 'med' ? 'at-risk' : 'minor'
}

/* ====================== HERO: the one wow — margin-erosion waterfall ====================== */
function VillainCard({ leak }: { leak: Leak }) {
  const select = useStore((s) => s.select)
  const store = useStore((s) => s.store)
  const imported = useStore((s) => s.mode === 'imported')
  const sku = findSku(store, leak.skuId)
  const rowLabel = sku ? `${sku.sourceSku ?? sku.id} · ${sku.channel ?? sku.marketplace}` : leak.skuId
  const cause = imported ? leak.rootCause : (LEAK_CAUSE[leak.type] ?? LEAK_PLAIN[leak.type])
  return (
    <button
      className={`villain sev-${leak.severity}`}
      onClick={() => select(leak.id)}
    >
      <span className="sr-only">{`${cause}, ${formatEur(leak.ratePerDayCents)} a day to review.`}</span>
      <div className="v-top">
        <span className={`v-icon sev-${leak.severity}`} aria-hidden="true"><LeakIcon type={leak.type} size={17} /></span>
        <span className={`sev-badge ${leak.severity}`}>{sevLabel(leak.severity)}</span>
        <span className="v-rate num">{imported ? '' : '−'}{formatEur(leak.ratePerDayCents)}<span className="per">/day</span></span>
      </div>
      <div className="v-sku">
        <span className="title">{sku?.title ?? leak.skuId}</span>
        <span className="id num">{rowLabel}</span>
      </div>
      <div className="v-cause">{cause}</div>
    </button>
  )
}

function Hero() {
  const { kpis } = useStore((s) => s.derived)
  const leaks = useStore((s) => s.derived.activeLeaks)
  const store = useStore((s) => s.store)
  const paused = useStore((s) => s.paused)
  const togglePause = useStore((s) => s.togglePause)
  const openModal = useStore((s) => s.openModal)
  const mode = useStore((s) => s.mode)
  const imported = mode === 'imported'
  const calm = kpis.activeThreatCount === 0

  const bars = useMemo(() => storeWaterfall(store), [store])
  const villains = useMemo(
    () => [...leaks].sort((a, b) => b.ratePerDayCents - a.ratePerDayCents).slice(0, 3),
    [leaks],
  )
  // SKUs that are actively leaking — the honest engine count behind the headline.
  const leakingSkus = useMemo(() => new Set(leaks.map((l) => l.skuId)).size, [leaks])

  return (
    <section className={`hero ${calm ? 'calm' : ''}`} aria-label="Margin erosion overview">
      <div className="hero-top">
        <div className="hero-copy">
          <div className="overline">
            <span className={`live ${calm ? 'ok' : ''}`}><span className="dot" aria-hidden="true" />{imported ? 'REVIEW' : calm ? 'SECURED' : 'LIVE'}</span>
            {imported ? 'CSV profitability audit' : 'Profit-leak control tower'}
          </div>
          <h2 className="hero-headline">
            {calm ? (
              imported
                ? <>No priced finding <span className="hl ok">in the supplied data.</span></>
                : <>Every modelled leak is <span className="hl ok">stopped.</span></>
            ) : (
              imported
                ? <>Your largest margin gaps, <span className="hl">based on supplied costs.</span></>
                : <>Find the profit killers <span className="hl">before they eat your margin.</span></>
            )}
          </h2>

          <div className="hero-number num" role="status" aria-live="polite"
            aria-label={calm ? 'Monthly finding impact is zero' : imported ? `About ${formatEur(kpis.monthlyLeakProjectionCents)} monthly improvement to review` : `Losing about ${formatEur(kpis.monthlyLeakProjectionCents)} every month`}>
            {!calm && !imported && <span className="lead-minus" aria-hidden="true">−</span>}
            {calm ? '€0' : <CountUpEuro valueCents={kpis.monthlyLeakProjectionCents} />}
            <span className="unit">/ month {imported ? 'to review' : 'at this rate'}</span>
          </div>
          <p className="hero-sub">
            {calm ? (
              imported
                ? <>No priced issue crossed the review thresholds. Check the coverage line above before treating this as a clean bill of health.</>
                : <>Every simulated leak is stopped — the demo run-rate is back to zero.</>
            ) : (
              imported
                ? <>Normalised from the supplied period across <b className="num">{leakingSkus} row{leakingSkus === 1 ? '' : 's'}</b>. Missing costs are excluded and shown separately.</>
                : <>The sample shop is quietly losing this across <b className="num">{leakingSkus} SKUs</b>. Open any finding to inspect the simulated fix.</>
            )}
          </p>

          <div className="hero-cta">
            <button className="btn btn-accent btn-lg" onClick={() => openModal('import')}>
              <IconActivity size={16} /> Analyse my exports
            </button>
          </div>
        </div>

        <div className="hero-wf">
          <div className="wf-head">
            <span className="overline">Where the margin drains · monthly</span>
            {!imported && (
              <button className="wf-pause" onClick={togglePause} aria-pressed={paused} title={paused ? 'Resume live feed' : 'Pause live feed'}>
                {paused ? <IconPlay size={13} /> : <IconPause size={13} />}{paused ? 'Resume' : 'Pause'}
              </button>
            )}
          </div>
          <Waterfall bars={bars} />
        </div>
      </div>

      {!calm && (
        <div className="villains" aria-label="Top profit killers">
          <div className="villains-label overline">Top 3 profit killers — click to {imported ? 'inspect the evidence' : 'see the demo fix'}</div>
          <div className="villains-grid">
            {villains.map((l) => <VillainCard key={l.id} leak={l} />)}
          </div>
        </div>
      )}
    </section>
  )
}

function Kpi({ label, value, foot, accent, icon, sparkKey, color }: {
  label: string; value: string; foot: string; accent?: string;
  icon: ReactNode; sparkKey: string; color: string
}) {
  const seed = useStore((s) => s.store.seed)
  const data = useMemo(() => sparkline(seed, sparkKey, 24), [seed, sparkKey])
  return (
    <div className={`kpi ${accent ?? ''}`}>
      <div className="k-label">{icon}{label}</div>
      <div className="k-val num">{value}</div>
      <div className="k-foot">{foot}</div>
      <div className="k-spark"><Sparkline data={data} color={color} /></div>
    </div>
  )
}

function KpiTiles() {
  const { kpis } = useStore((s) => s.derived)
  const mode = useStore((s) => s.mode)
  const skus = useStore((s) => s.store.skus)
  const coverage = useMemo(() => summarizeCoverage(skus), [skus])
  if (mode === 'imported') {
    return (
      <div className="kpis">
        <Kpi label="Average daily sales" value={formatEur(kpis.revenueTodayCents)} foot="normalised from the supplied period" accent="accent-gold" icon={<IconEuro size={14} />} sparkKey="revenue" color="#F5B544" />
        <Kpi label="Average daily profit" value={formatEur(kpis.netProfitTodayCents)} foot={`${pct(kpis.marginPct)} after supplied costs`} accent="accent-green" icon={<IconTrendDown size={14} />} sparkKey="profit" color="#33CC85" />
        <Kpi label="Cost data coverage" value={`${coverage.scorePct}%`} foot={coverage.missing.length ? `${coverage.missing.length} cost groups still missing` : 'all core cost groups supplied'} accent="accent-amber" icon={<IconPercent size={14} />} sparkKey="coverage" color="#F3B23C" />
        <Kpi label="Findings to review" value={String(kpis.activeThreatCount)} foot={`${formatEur(kpis.monthlyLeakProjectionCents)}/mo normalised impact`} accent="accent-red" icon={<IconAlert size={14} />} sparkKey="threats" color="#EB5757" />
      </div>
    )
  }
  return (
    <div className="kpis">
      <Kpi label="Demo sales today" value={formatEur(kpis.revenueTodayCents)} foot="synthetic marketplace data" accent="accent-gold" icon={<IconEuro size={14} />} sparkKey="revenue" color="#F5B544" />
      <Kpi label="Demo profit today" value={formatEur(kpis.netProfitTodayCents)} foot={`${pct(kpis.marginPct)} simulated margin`} accent="accent-green" icon={<IconTrendDown size={14} />} sparkKey="profit" color="#33CC85" />
      <Kpi label="Demo claims" value={formatEur(kpis.reimbursementsPendingCents)} foot="illustrative fee disputes" accent="accent-amber" icon={<IconPercent size={14} />} sparkKey="margin" color="#F3B23C" />
      <Kpi label="Demo findings" value={String(kpis.activeThreatCount)} foot={`${formatEur(kpis.monthlyLeakProjectionCents)}/mo simulated impact`} accent="accent-red" icon={<IconAlert size={14} />} sparkKey="threats" color="#EB5757" />
    </div>
  )
}

function minsAgo(detectedAtMs: number, clockMs: number) {
  const m = Math.max(1, Math.round((clockMs - detectedAtMs) / 60000))
  return m < 60 ? `${m}m ago` : `${Math.round(m / 60)}h ago`
}

function ThreatRow({ leak }: { leak: Leak }) {
  const select = useStore((s) => s.select)
  const store = useStore((s) => s.store)
  const imported = useStore((s) => s.mode === 'imported')
  const sku = findSku(store, leak.skuId)
  const rowLabel = sku ? `${sku.sourceSku ?? sku.id} on ${sku.channel ?? sku.marketplace}` : leak.skuId
  const label = `${leak.title} — ${plainLeak(leak)}. ${sevLabel(leak.severity)} priority, ${rowLabel}, ${formatEur(leak.ratePerDayCents)} a day to review.`
  return (
    <motion.div
      className="threat" onClick={() => select(leak.id)} role="button" tabIndex={0} aria-label={label}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(leak.id) } }}
      layout initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 60, transition: { duration: 0.25 } }}
    >
      <span className={`ticon ${leak.severity}`} aria-hidden="true"><LeakIcon type={leak.type} size={19} /></span>
      <div className="tmain">
        <div className="ttitle">{leak.title}<span className={`sev-badge ${leak.severity}`}>{sevLabel(leak.severity)}</span></div>
        <div className="tplain">{plainLeak(leak)}</div>
        <div className="tmeta">
          <span className="sku num">{rowLabel}</span>
          <span className="dot-sep" aria-hidden="true">·</span>
          <span>{sku?.category}</span>
          <span className="dot-sep" aria-hidden="true">·</span>
          <span>{minsAgo(leak.detectedAtMs, store.clockMs)}</span>
        </div>
      </div>
      <div className="trate">
        <div className="r num">{imported ? '' : '−'}{formatEur(leak.ratePerDayCents)}</div>
        <div className="rl">/ day</div>
      </div>
      <span className="threat-chevron" aria-hidden="true">›</span>
    </motion.div>
  )
}

const TOP_N = 4
function ThreatFeed() {
  const leaks = useStore((s) => s.derived.activeLeaks)
  const mode = useStore((s) => s.mode)
  const [showAll, setShowAll] = useState(false)
  const sorted = [...leaks].sort((a, b) => b.ratePerDayCents - a.ratePerDayCents)
  const hidden = Math.max(0, sorted.length - TOP_N)
  const visible = showAll ? sorted : sorted.slice(0, TOP_N)
  return (
    <section className="card" aria-label="Where you’re losing money">
      <div className="card-head">
        <IconActivity size={17} aria-hidden="true" />
        <h2>Where you’re losing money</h2>
        <span className="count">{sorted.length === 0 ? 'all clear' : `${sorted.length} to fix · biggest first`}</span>
      </div>
      <div className="feed-list">
        {sorted.length === 0 ? (
          <div className="feed-empty">
            <div className="big"><IconCheck size={26} /></div>
            <h3>All clear</h3>
            <p>{mode === 'imported' ? 'No priced finding crossed the thresholds in the supplied rows. Review data coverage before making a decision.' : 'Every simulated leak is stopped in this demo.'}</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {visible.map((l) => <ThreatRow key={l.id} leak={l} />)}
          </AnimatePresence>
        )}
      </div>
      {hidden > 0 && (
        <button className="feed-more" onClick={() => setShowAll((v) => !v)} aria-expanded={showAll}>
          {showAll ? 'Show fewer' : `Show ${hidden} more`}
          <span className={`chev ${showAll ? 'up' : ''}`} aria-hidden="true">⌄</span>
        </button>
      )}
    </section>
  )
}

function RoiProjector() {
  const store = useStore((s) => s.store)
  const [days, setDays] = useState(30)
  const projected = projectSavingsCents(store, days)
  const resolved = store.resolvedCount
  return (
    <div className="card roi">
      <div className="card-head"><IconSparkles size={16} /><h2>Demo savings projection</h2></div>
      <div className="card-body">
        <div className="slider-row">
          <input type="range" min={7} max={90} step={1} value={days} onChange={(e) => setDays(+e.target.value)} aria-label="Projection days" />
          <span className="days num">{days} days</span>
        </div>
        <div className="roi-val num">{formatEur(projected)}</div>
        <div className="roi-note">
          {resolved === 0
            ? 'Apply a simulated fix above, then drag to see the projected effect.'
            : `Illustrative projection based on ${resolved} simulated fixes in the demo store.`}
        </div>
      </div>
    </div>
  )
}

function DigestCard() {
  const { kpis } = useStore((s) => s.derived)
  const resolvedCount = useStore((s) => s.store.resolvedCount)
  const storeName = useStore((s) => s.store.storeName)
  return (
    <div className="card digest">
      <div className="card-head"><IconSend size={16} /><h2>Weekly digest preview</h2><span className="count">preview</span></div>
      <div className="card-body">
        <div className="msg">
          <div className="h"><IconBell size={15} /> MarginPulse · {storeName}</div>
          <div className="li">Marked <b className="num">{resolvedCount}</b> issues resolved in local model</div>
          <div className="li">Modelled weekly effect: <b className="num">{formatEur(kpis.savedThisWeekCents)}</b></div>
          <div className="li">Possible claim drafts to review: <b className="num">{formatEur(kpis.reimbursementsPendingCents)}</b></div>
          <div className="li">Still modelled: <b className="num">{formatEur(kpis.monthlyLeakProjectionCents)}</b>/mo — {kpis.activeThreatCount} left</div>
        </div>
      </div>
    </div>
  )
}

function AnalysisSummaryCard() {
  const store = useStore((s) => s.store)
  const coverage = useMemo(() => summarizeCoverage(store.skus), [store.skus])
  const channels = useMemo(
    () => [...new Set(store.skus.map((sku) => sku.channel ?? 'Store'))].sort(),
    [store.skus],
  )
  const downloadReport = () => {
    const blob = new Blob([profitReportCsv(store.skus)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${store.storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'marginpulse'}-profit-report.csv`
    link.click()
    URL.revokeObjectURL(url)
  }
  return (
    <div className="card digest">
      <div className="card-head"><IconCheck size={16} /><h2>Analysis handoff</h2><span className="count">ready to export</span></div>
      <div className="card-body">
        <div className="msg">
          <div className="h"><IconActivity size={15} /> {store.storeName}</div>
          <div className="li"><b className="num">{store.skuCount}</b> product-channel row{store.skuCount === 1 ? '' : 's'} analysed</div>
          <div className="li">Channels: <b>{channels.join(' + ')}</b></div>
          <div className="li">Cost data coverage: <b className="num">{coverage.scorePct}%</b></div>
          <div className="li">Missing inputs remain blank in the downloadable report.</div>
          <div style={{ marginTop: '14px' }}>
            <button className="btn btn-sm btn-primary" onClick={downloadReport} style={{ width: '100%', justifyContent: 'center' }}>
              <IconDownload size={14} /> Download profit report (.csv)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Toast() {
  const toast = useStore((s) => s.toast)
  const clear = useStore((s) => s.clearToast)
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(clear, 3200)
    return () => clearTimeout(t)
  }, [toast, clear])
  return (
    <AnimatePresence>
      {toast && (
        <motion.div className="toast" role="status" aria-live="polite"
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }}>
          <span className="ti" aria-hidden="true"><IconCheck size={18} /></span>
          <div>
            <div className="tt">{toast.title}</div>
            <div className="ts num">+{formatEur(toast.amountCents)} / week in local model</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function App() {
  const tick = useStore((s) => s.tick)
  const selectedLeakId = useStore((s) => s.selectedLeakId)
  const store = useStore((s) => s.store)
  const select = useStore((s) => s.select)
  const resolve = useStore((s) => s.resolve)
  const modal = useStore((s) => s.modal)
  const openModal = useStore((s) => s.openModal)
  const closeModal = useStore((s) => s.closeModal)
  const mode = useStore((s) => s.mode)
  const selectedStage = useStore((s) => s.selectedStage)
  const setSelectedStage = useStore((s) => s.setSelectedStage)
  const isExecutiveReportOpen = useStore((s) => s.isExecutiveReportOpen)
  const setExecutiveReportOpen = useStore((s) => s.setExecutiveReportOpen)
  const selected = store.leaks.find((l) => l.id === selectedLeakId && l.status === 'active') ?? null

  useEffect(() => {
    if (mode === 'imported') return
    const id = setInterval(() => tick(SCALED_MS), TICK_MS)
    return () => clearInterval(id)
  }, [tick, mode])

  return (
    <div className="app">
      {/* deep-space control-room backdrop — fixed, behind everything (gold + cyan nebula glows + masked star grid) */}
      <div className="space-bg" aria-hidden="true" />
      <div className="space-grid" aria-hidden="true" />
      <a href="#main" className="skip-link">Skip to dashboard</a>
      <DemoBanner />
      <PresetBar />
      <header><TopBar /></header>
      <main id="main">
        <Hero />
        <Reveal className="band"><KpiTiles /></Reveal>

        <Reveal className="band">
          <InteractiveWaterfall
            store={store}
            selectedStage={selectedStage}
            onSelectStage={setSelectedStage}
          />
        </Reveal>

        <Reveal className="band">
          <div className="grid">
            <ThreatFeed />
            <div className="panel-stack">
              {mode === 'imported' ? <AnalysisSummaryCard /> : <><RoiProjector /><DigestCard /></>}
            </div>
          </div>
        </Reveal>

        <Reveal className="band">
          <SkuLedgerTable
            store={store}
            selectedStage={selectedStage}
            onClearStageFilter={() => setSelectedStage(null)}
            onSelectSku={(sku) => {
              const leak = store.leaks.find((l) => l.skuId === sku.id)
              if (leak) select(leak.id)
            }}
          />
        </Reveal>

        <Reveal className="band">
          <section className="cta-band" aria-label="Try it on your store">
            <div className="cta-copy">
              <h2>Want to see your own numbers?</h2>
              <p>Upload standard Shopify or Amazon exports. MarginPulse recognises the files, joins costs by SKU and shows what is missing before it calculates profit.</p>
            </div>
            <div className="cta-actions">
              <button className="btn btn-lg btn-accent" onClick={() => openModal('import')}>
                <IconActivity size={16} /> Upload my exports
              </button>
            </div>
          </section>
        </Reveal>
      </main>

      <AnimatePresence>
        {selected && (
          <LeakDrawer
            key={selected.id}
            leak={selected}
            store={store}
            imported={mode === 'imported'}
            onClose={() => select(null)}
            onAction={(a) => resolve(selected.id, a)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modal === 'import' && <ImportPanel key="import" onClose={closeModal} />}
      </AnimatePresence>

      <ExecutiveReportModal
        isOpen={isExecutiveReportOpen}
        onClose={() => setExecutiveReportOpen(false)}
        store={store}
      />

      <footer style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(15, 23, 42, 0.75)', padding: '24px', marginTop: '32px' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
              MarginPulse · In-Browser Profit Leak Engine
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
              Zero server data exfiltration · Deterministic integer-cent math
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', fontSize: '13px' }}>
            <a href="https://m1hamuha.github.io/portfolio/" target="_blank" rel="noreferrer" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 600 }}>
              ← Central Portfolio Hub
            </a>
            <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>·</span>
            <a href="https://github.com/m1hamuha/portfolio_10_out_of_10" target="_blank" rel="noreferrer" style={{ color: '#94a3b8', textDecoration: 'none' }}>
              GitHub Repository
            </a>
            <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>·</span>
            <a href="https://m1hamuha.github.io/portfolio/invoice-autopilot/" target="_blank" rel="noreferrer" style={{ color: '#94a3b8', textDecoration: 'none' }}>
              InvoiceAutopilot
            </a>
            <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>·</span>
            <a href="https://m1hamuha.github.io/portfolio/slotsaver/" target="_blank" rel="noreferrer" style={{ color: '#94a3b8', textDecoration: 'none' }}>
              SlotSaver
            </a>
          </div>
        </div>
      </footer>

      <Toast />
    </div>
  )
}
