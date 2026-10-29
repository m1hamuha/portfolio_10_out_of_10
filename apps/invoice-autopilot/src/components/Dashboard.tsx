import { motion, AnimatePresence } from 'framer-motion'
import { useStore, DOCS } from '../store/useStore'
import {
  formatEur,
  formatDuration,
  MANUAL_SEC,
  AUTO_SEC,
  ledgerGrossCents,
  exportToCsv,
  exportToJson,
  exportToDatevExtf,
  downloadFile,
} from '../engine'
import { AnimatedDuration, AnimatedInt, AnimatedEuro, BeforeAfter } from './widgets'
import { Gloss } from './Gloss'
import {
  IconBook,
  IconBell,
  IconClock,
  IconShield,
  IconReceipt,
  IconEuro,
  IconInbox,
} from './icons'

// €/hour blended bookkeeping rate used to translate saved time into money.
const HOURLY_EUR_CENTS = 45_00

export function SavedCounter() {
  const ledger = useStore((s) => s.ledger)
  const savedEurCents = Math.round((ledger.savedSeconds / 3600) * HOURLY_EUR_CENTS)
  return (
    <div className="saved-counter">
      <div className="sc-head">
        <span className="sc-ico">
          <IconShield size={18} />
        </span>
        <div>
          <div className="sc-label">Saved this month</div>
          <div className="sc-sub">
            across {ledger.docCount} processed {ledger.docCount === 1 ? 'document' : 'documents'}
          </div>
        </div>
      </div>
      <div className="sc-figures">
        <div className="sc-fig">
          <AnimatedDuration seconds={ledger.savedSeconds} className="sc-val num" />
          <span className="sc-cap">bookkeeping time</span>
        </div>
        <div className="sc-divider" />
        <div className="sc-fig">
          <AnimatedEuro valueCents={savedEurCents} className="sc-val num green" />
          <span className="sc-cap">labour cost</span>
        </div>
        <div className="sc-divider" />
        <div className="sc-fig">
          <AnimatedInt value={ledger.errorsPrevented} className="sc-val num amber" />
          <span className="sc-cap">errors prevented</span>
        </div>
      </div>
    </div>
  )
}

export function Ledger() {
  const ledger = useStore((s) => s.ledger)
  const total = ledgerGrossCents(ledger)

  const handleExportCsv = () => {
    const csv = exportToCsv(ledger.entries)
    downloadFile('invoiceautopilot-ledger.csv', csv, 'text/csv;charset=utf-8;')
  }

  const handleExportJson = () => {
    const json = exportToJson(ledger.entries)
    downloadFile('invoiceautopilot-ledger.json', json, 'application/json')
  }

  const handleExportDatev = () => {
    const datev = exportToDatevExtf(ledger.entries)
    downloadFile('EXTF_Buchungsstapel.csv', datev, 'text/csv;charset=utf-8;')
  }

  return (
    <div className="panel ledger">
      <div className="panel-head">
        <IconBook size={16} />
        <h3>Your accounting ledger</h3>
        <span className="count">{ledger.docCount} filed</span>
      </div>
      <div className="panel-body">
        {ledger.entries.length === 0 ? (
          <div className="ledger-empty">
            <IconInbox size={26} />
            <p>Nothing filed yet. Check an invoice and send it to accounting — it lands here as a row.</p>
          </div>
        ) : (
          <>
            <div className="ledger-table">
              <div className="lt-head">
                <span>Supplier</span>
                <span>Invoice</span>
                <span className="r">Net</span>
                <span className="r">VAT</span>
                <span className="r">Gross</span>
                <span>→</span>
              </div>
              <AnimatePresence initial={false}>
                {ledger.entries.map((e) => (
                  <motion.div
                    className="lt-row"
                    key={`${e.docId}-${e.postedAtMs}`}
                    initial={{ opacity: 0, y: -10, backgroundColor: 'hsla(152,60%,50%,0.16)' }}
                    animate={{ opacity: 1, y: 0, backgroundColor: 'hsla(152,60%,50%,0)' }}
                    transition={{ duration: 0.5 }}
                  >
                    <span className="lt-supplier">
                      {e.hadFix && <span className="lt-fixed" title="An error was corrected before posting" />}
                      {e.supplier}
                    </span>
                    <span className="num lt-inv">{e.invoiceNo}</span>
                    <span className="r num">{formatEur(e.netCents)}</span>
                    <span className="r num">{formatEur(e.vatCents)}</span>
                    <span className="r num lt-gross">{formatEur(e.grossCents)}</span>
                    <span className="lt-target">{e.target}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <div className="ledger-total">
              <span>Total posted</span>
              <b className="num">{formatEur(total)}</b>
            </div>

            {/* Export Toolbar */}
            <div className="ledger-export-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ fontSize: 12, color: 'var(--color-text-dim, #94a3b8)', fontWeight: 600 }}>Accounting Export:</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-ghost btn-xs"
                  onClick={handleExportCsv}
                  title="Export RFC 4180 CSV"
                >
                  CSV (RFC 4180)
                </button>
                <button
                  className="btn btn-ghost btn-xs"
                  onClick={handleExportJson}
                  title="Export Structured JSON"
                >
                  JSON
                </button>
                <button
                  className="btn btn-primary btn-xs"
                  onClick={handleExportDatev}
                  title="Export DATEV EXTF 700 format"
                >
                  DATEV EXTF 700
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export function DigestCard() {
  const ledger = useStore((s) => s.ledger)
  const savedEurCents = Math.round((ledger.savedSeconds / 3600) * HOURLY_EUR_CENTS)
  const has = ledger.docCount > 0
  return (
    <div className="panel digest">
      <div className="panel-head">
        <IconBell size={16} />
        <h3>Team digest</h3>
        <span className="count">Telegram · Slack</span>
      </div>
      <div className="panel-body">
        <div className="digest-msg">
          <div className="dm-head">
            <span className="dm-avatar">
              <IconShield size={15} />
            </span>{' '}
            InvoiceAutopilot · Bot
          </div>
          {has ? (
            <>
              <div className="dm-line">
                <IconReceipt size={14} /> Processed <b className="num">{ledger.docCount}</b> supplier{' '}
                {ledger.docCount === 1 ? 'document' : 'documents'}
              </div>
              <div className="dm-line">
                <IconClock size={14} /> Saved <b className="num">{formatDuration(ledger.savedSeconds)}</b> of keying
              </div>
              <div className="dm-line">
                <IconEuro size={14} /> Worth <b className="num">{formatEur(savedEurCents)}</b> in labour
              </div>
              <div className="dm-line">
                <IconShield size={14} /> <b className="num">{ledger.errorsPrevented}</b> error
                {ledger.errorsPrevented === 1 ? '' : 's'} caught before the books
              </div>
            </>
          ) : (
            <div className="dm-line muted">Your first digest posts after the run — process a document to see it.</div>
          )}
        </div>
      </div>
    </div>
  )
}

export function BeforeAfterPanel() {
  return (
    <div className="panel ba-panel">
      <div className="panel-head">
        <IconClock size={16} />
        <h3>Time per document</h3>
      </div>
      <div className="panel-body">
        <BeforeAfter manualSec={MANUAL_SEC} autoSec={AUTO_SEC} />
      </div>
    </div>
  )
}

export function DemoBanner() {
  return (
    <div className="honesty">
      <span className="dot" />
      <span>
        <b>This is a demo on representative European invoices.</b> In the real product it reads your own
        inbox, e-invoicing feed (PEPPOL
        <Gloss k="peppol" />) or scanner and files straight into your accounting software. It helps your bookkeeper — it doesn’t replace them.
      </span>
    </div>
  )
}

export function DocProgress() {
  const ledger = useStore((s) => s.ledger)
  const postedIds = new Set(ledger.entries.map((e) => e.docId))
  return (
    <div className="docprogress">
      {DOCS.map((d) => (
        <span key={d.id} className={`dp-dot ${postedIds.has(d.id) ? 'done' : ''}`} title={d.label} />
      ))}
      <span className="dp-label">
        {postedIds.size}/{DOCS.length} posted
      </span>
    </div>
  )
}
