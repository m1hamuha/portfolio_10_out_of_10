import { AnimatePresence, motion } from 'framer-motion'
import { formatEur, type Extraction, type Issue } from '../engine'
import { useStore } from '../store/useStore'
import { ConfidenceMeter } from './widgets'
import { Gloss } from './Gloss'
import { DuplicateDiffModal } from './DuplicateDiffModal'
import {
  IconScan,
  IconCheckCircle,
  IconAlert,
  IconWand,
  IconCheck,
  IconSend,
  IconFile,
  IconArrowRight,
  IconShield,
} from './icons'

function avgConfidence(ext: Extraction): number {
  const fields = [
    ext.supplier.confidence,
    ext.vatId.confidence,
    ext.invoiceNo.confidence,
    ext.invoiceDate.confidence,
    ext.dueDate.confidence,
    ext.netCents.confidence,
    ext.vatCents.confidence,
    ext.grossCents.confidence,
    ...(ext.iban ? [ext.iban.confidence] : []),
    ...ext.lineItems.map((l) => l.confidence),
  ]
  return fields.reduce((a, c) => a + c, 0) / fields.length
}

function FieldRow({
  label,
  value,
  confidence,
  index,
  total,
  flagged,
  gloss,
}: {
  label: string
  value: string
  confidence: number
  index: number
  total: number
  flagged?: boolean
  gloss?: 'vatId'
}) {
  const low = confidence < 0.8
  return (
    <motion.div
      className={`frow ${flagged ? 'flagged' : ''} ${low ? 'low-conf' : ''}`}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: (index / Math.max(total, 1)) * 0.5, duration: 0.28 }}
    >
      <span className="frow-label">
        {label}
        {gloss && <Gloss k={gloss} />}
      </span>
      <span className="frow-value num">{value}</span>
      <span
        className={`frow-conf ${low ? 'low' : ''}`}
        title={
          low
            ? `Read with lower confidence (${Math.round(confidence * 100)}%) — worth a glance`
            : `Read clearly (${Math.round(confidence * 100)}%)`
        }
      >
        <span className="conf-bar">
          <span style={{ width: `${confidence * 100}%` }} />
        </span>
      </span>
    </motion.div>
  )
}

function IssueFlag({ ext, issue }: { ext: Extraction; issue: Issue }) {
  const fixIssue = useStore((s) => s.fixIssue)
  const confirmIssue = useStore((s) => s.confirmIssue)
  const setDiffModalOpen = useStore((s) => s.setDiffModalOpen)
  const line = issue.lineIndex != null ? ext.lineItems[issue.lineIndex] : null
  const suggested = issue.suggestedFixCents

  if (issue.kind === 'duplicate_detected') {
    return (
      <motion.div
        className="issue"
        style={{ borderColor: 'var(--color-amber-500, #f59e0b)' }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="issue-head">
          <span className="issue-ico">
            <IconAlert size={17} />
          </span>
          <div>
            <div className="issue-title" style={{ color: 'var(--color-amber-400, #fbbf24)' }}>
              Duplicate Invoice Detected
            </div>
            <div className="issue-msg">{issue.message}</div>
          </div>
        </div>
        <div className="issue-actions">
          <button className="btn btn-fix" onClick={() => setDiffModalOpen(true)}>
            <IconShield size={15} /> Review Visual Diff
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="issue"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
    >
      <div className="issue-head">
        <span className="issue-ico">
          <IconAlert size={17} />
        </span>
        <div>
          <div className="issue-title">
            {issue.kind === 'price_anomaly' ? 'Unit price looks off' : 'Check this field'}
          </div>
          <div className="issue-msg">{issue.message}</div>
        </div>
      </div>
      {issue.kind === 'price_anomaly' && line && suggested != null && (
        <div className="issue-diff">
          <span className="bad num">{formatEur(line.unitPriceCents)}</span>
          <IconArrowRight size={15} />
          <span className="good num">{formatEur(suggested)}</span>
          <span className="diff-note">
            per unit · {line.qty} × {formatEur(suggested)} = {formatEur(line.qty * suggested)}
          </span>
        </div>
      )}
      <div className="issue-actions">
        <button className="btn btn-fix" onClick={() => fixIssue(issue.id)}>
          <IconWand size={15} /> Fix it
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => confirmIssue(issue.id)}>
          <IconCheck size={14} /> Keep as is
        </button>
      </div>
    </motion.div>
  )
}

export function ExtractionCard() {
  const phase = useStore((s) => s.phase)
  const ext = useStore((s) => s.extraction)
  const issues = useStore((s) => s.issues)
  const startScan = useStore((s) => s.startScan)
  const scanProgress = useStore((s) => s.scanProgress)
  const target = useStore((s) => s.target)
  const setTarget = useStore((s) => s.setTarget)
  const post = useStore((s) => s.post)
  const reset = useStore((s) => s.reset)
  const duplicateResult = useStore((s) => s.duplicateResult)
  const isDiffModalOpen = useStore((s) => s.isDiffModalOpen)
  const setDiffModalOpen = useStore((s) => s.setDiffModalOpen)
  const forceApprove = useStore((s) => s.forceApprove)
  const rejectDuplicate = useStore((s) => s.rejectDuplicate)

  if (phase === 'ready') {
    return (
      <aside className="excard">
        <div className="excard-head">
          <IconFile size={17} />
          <h2>What we read</h2>
        </div>
        <div className="excard-placeholder ready">
          <p>
            The invoice is loaded and straightened. Press scan to read it — every field appears here as the line
            sweeps the page.
          </p>
          <button className="btn btn-primary btn-scan" onClick={startScan}>
            <IconScan size={17} /> Scan this invoice
          </button>
        </div>
      </aside>
    )
  }

  if (phase === 'idle' || !ext) {
    return (
      <aside className="excard">
        <div className="excard-head">
          <IconFile size={17} />
          <h2>What we read</h2>
        </div>
        <div className="excard-placeholder">
          <p>Pick an invoice on the left and scan it. The details will appear here, one field at a time.</p>
        </div>
      </aside>
    )
  }

  const openErrors = issues.filter((i) => i.severity === 'error')
  const openWarns = issues.filter((i) => i.severity === 'warn')
  const liveConf = phase === 'scanning' ? avgConfidence(ext) * scanProgress : avgConfidence(ext)
  const clean = phase === 'review' && issues.length === 0
  const posted = phase === 'posted'
  const lineCount = ext.lineItems.length

  const fields: {
    label: string
    value: string
    confidence: number
    gloss?: 'vatId'
  }[] = [
    { label: 'Supplier', value: ext.supplier.value || '(Missing)', confidence: ext.supplier.confidence },
    { label: 'Tax number', value: ext.vatId.value || '(Missing)', confidence: ext.vatId.confidence, gloss: 'vatId' },
    ...(ext.iban ? [{ label: 'IBAN', value: ext.iban.value || '(Missing)', confidence: ext.iban.confidence }] : []),
    { label: 'Invoice number', value: ext.invoiceNo.value || '(Missing)', confidence: ext.invoiceNo.confidence },
    { label: 'Invoice date', value: ext.invoiceDate.value || '(Missing)', confidence: ext.invoiceDate.confidence },
    { label: 'Payment due', value: ext.dueDate.value || '(Missing)', confidence: ext.dueDate.confidence },
  ]

  return (
    <>
      <aside className="excard">
        <div className="excard-head">
          <IconFile size={17} />
          <h2>What we read</h2>
          <span className={`excard-status ${clean || posted ? 'ok' : openWarns.length ? 'warn' : ''}`}>
            {posted
              ? 'Filed'
              : phase === 'scanning'
              ? 'Reading…'
              : clean
              ? 'All checks passed'
              : `${openWarns.length + openErrors.length} to check`}
          </span>
        </div>

        <div className="excard-meterrow">
          <ConfidenceMeter value={liveConf} />
          <div className="meter-side">
            <div className="meter-line">
              <span>Fields read</span>
              <b className="num">{fields.length + lineCount + 3}</b>
            </div>
            <div className="meter-line">
              <span>Items on invoice</span>
              <b className="num">{lineCount}</b>
            </div>
            <div className="meter-line">
              <span>Tax check (VAT<Gloss k="vat" />)</span>
              <b className={clean || posted ? 'ok' : openErrors.length ? 'bad' : 'num'}>
                {openErrors.length ? 'mismatch' : phase === 'scanning' ? `${ext.vatRatePct.value}%` : `${ext.vatRatePct.value}% ✓`}
              </b>
            </div>
          </div>
        </div>

        <div className="excard-fields">
          {fields.map((f, i) => (
            <FieldRow key={f.label} {...f} index={i} total={fields.length + lineCount} />
          ))}
          <div className="frow-sep">What was bought</div>
          {ext.lineItems.map((l, i) => {
            const flagged = issues.some((iss) => iss.lineIndex === i && iss.kind === 'price_anomaly')
            return (
              <FieldRow
                key={`li-${i}`}
                label={l.desc}
                value={`${l.qty} × ${formatEur(l.unitPriceCents)}`}
                confidence={l.confidence}
                index={fields.length + i}
                total={fields.length + lineCount}
                flagged={flagged}
              />
            )
          })}
        </div>

        <div className="excard-totals">
          <div className="et-row">
            <span>
              Price before tax<Gloss k="net" />
            </span>
            <b className="num">{formatEur(ext.netCents.value)}</b>
          </div>
          <div className="et-row">
            <span>
              VAT tax ({ext.vatRatePct.value}%)<Gloss k="vat" />
            </span>
            <b className="num">{formatEur(ext.vatCents.value)}</b>
          </div>
          <div className={`et-row grand ${clean || posted ? 'ok' : ''}`}>
            <span>
              Total to pay<Gloss k="gross" />
            </span>
            <b className="num">{formatEur(ext.grossCents.value)}</b>
          </div>
          <div className="et-check">
            {openErrors.length ? (
              <span className="bad">
                <IconAlert size={13} /> The numbers don’t add up / Missing mandatory fields
              </span>
            ) : (
              <span className="ok">
                <IconCheckCircle size={13} /> The numbers all add up
              </span>
            )}
          </div>
        </div>

        <AnimatePresence>
          {issues.map((iss) => (
            <IssueFlag key={iss.id} ext={ext} issue={iss} />
          ))}
        </AnimatePresence>

        {clean && !posted && (
          <motion.div className="clean-banner" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
            <IconCheckCircle size={18} /> Ready to file — every field read and every number checks out.
          </motion.div>
        )}

        {!posted && (
          <div className="excard-foot">
            <div className="target-pick">
              <span>Send to</span>
              <div className="seg" role="group" aria-label="Choose accounting software">
                {(['Xero', 'DATEV'] as const).map((tg) => (
                  <button
                    key={tg}
                    className={`seg-btn ${target === tg ? 'active' : ''}`}
                    aria-pressed={target === tg}
                    onClick={() => setTarget(tg)}
                  >
                    {tg}
                  </button>
                ))}
              </div>
            </div>
            <button
              className="btn btn-primary btn-post"
              disabled={openErrors.length > 0}
              onClick={post}
            >
              <IconSend size={16} /> Send to accounting
            </button>
          </div>
        )}

        {posted && (
          <motion.div
            className="posted-banner"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <span className="pb-ico">
              <IconCheckCircle size={26} />
            </span>
            <div>
              <div className="pb-title">Filed into {target}</div>
              <div className="pb-sub">
                Entry created · {formatEur(ext.grossCents.value)} · {ext.invoiceNo.value}
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={reset}>
              Next invoice
            </button>
          </motion.div>
        )}
      </aside>

      {duplicateResult && (
        <DuplicateDiffModal
          isOpen={isDiffModalOpen}
          onClose={() => setDiffModalOpen(false)}
          incoming={ext}
          detectionResult={duplicateResult}
          onRejectDuplicate={rejectDuplicate}
          onForceApprove={forceApprove}
        />
      )}
    </>
  )
}
