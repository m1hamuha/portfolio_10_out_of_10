import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { formatEur, findSku, waterfallFor, type ActionType, type Leak, type Store } from '../engine'
import { Waterfall } from './Waterfall'
import { LeakIcon, IconClose, IconShield, IconSparkles } from './icons'

const ACTION_LABEL: Record<ActionType, string> = {
  SET_PRICE_FLOOR: 'Simulate price floor',
  PAUSE_REPRICER: 'Simulate repricer pause',
  DISPUTE_FEE: 'Simulate fee dispute',
  DISPUTE_STORAGE: 'Simulate removal order',
  RESOLVE_RETURNS: 'Simulate returns rule',
  WIN_BUYBOX: 'Simulate Buy Box recovery',
  FIX_VAT: 'Simulate VAT correction',
  CAP_AD_SPEND: 'Simulate ad-spend cap',
  CREATE_RESTOCK_ALERT: 'Simulate restock alert',
}

/** Reply drafts woven around the actual SKU so they read coherently for any catalogue (demo or imported). */
function sampleReplies(item: string) {
  return [
    { who: '1-star review · "Not as described"', text: `Hi — I'm sorry the ${item} didn't match the listing. We've corrected the photos and specs, sent a free replacement and a care card, and would love to put this right.` },
    { who: 'Return message · "Smaller / different than expected"', text: `Thanks for flagging — the ${item} listing now shows full dimensions on image 2. We've issued a prepaid label and the correct option is on its way, no charge.` },
    { who: 'Return message · "Arrived damaged"', text: `Apologies for the condition on arrival. A replacement ${item} is on its way and we've added protective packaging for future orders. If you'd prefer a refund, it's one tap away.` },
  ]
}

export function LeakDrawer({
  leak,
  store,
  onClose,
  onAction,
  imported = false,
}: {
  leak: Leak
  store: Store
  onClose: () => void
  onAction: (action: ActionType) => void
  imported?: boolean
}) {
  const sku = findSku(store, leak.skuId)
  const bars = waterfallFor(store, leak.skuId)
  const monthly = leak.ratePerDayCents * 30
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  // Focus management + keyboard: focus the panel on open, trap Tab, close on Escape.
  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return }
      if (e.key !== 'Tab') return
      const panel = panelRef.current
      if (!panel) return
      const focusables = panel.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      if (!focusables.length) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, leak.id])

  return (
    <>
      <motion.div className="scrim" onClick={onClose} aria-hidden="true"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
      <motion.aside ref={panelRef} className="drawer" role="dialog" aria-modal="true" aria-label={leak.title}
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 320 }}>
        <header className="drawer-head">
          <div className="top">
            <span className={`dicon sev-${leak.severity}`} aria-hidden="true">
              <LeakIcon type={leak.type} size={22} />
            </span>
            <div className="dhead-text">
              <h2>{leak.title}</h2>
              <div className="sub">
                {sku ? `${sku.title} · ${sku.sourceSku ?? sku.id} · ${sku.channel ?? 'Store'} ${sku.marketplace}` : leak.skuId}
              </div>
            </div>
            <button ref={closeRef} className="btn btn-ghost btn-icon close" onClick={onClose} aria-label="Close panel">
              <IconClose size={16} />
            </button>
          </div>
        </header>

        <div className="drawer-body">
          <div className="bleed-banner">
            <span className="l">{imported ? 'Monthly improvement to review' : 'This simulated issue is costing'}</span>
            <span className="v">{formatEur(monthly)}<span style={{ fontSize: 13, color: 'var(--text-dim)', fontWeight: 400 }}> / month</span></span>
          </div>

          <p className="rootcause"><b>What’s happening.</b> {leak.rootCause}</p>
          <p className="rootcause" style={{ marginTop: 8 }}>{leak.detail}</p>

          <div className="section-title">Monthly P&amp;L bridge — {sku?.id}</div>
          <Waterfall bars={bars} />

          {!imported && (leak.type === 'FEE_HIKE' || leak.type === 'STORAGE_FEE') && leak.claimCents && (
            <>
              <div className="section-title">Reimbursement claim — local draft</div>
              <div className="claim-box">
{`Case type: ${leak.type === 'FEE_HIKE' ? 'FBA fee / dimension re-measurement' : 'Long-term storage removal'}
ASIN: ${sku?.asin}   SKU: ${sku?.id}   Marketplace: Amazon.${sku?.marketplace.toLowerCase()}
Claim amount: ${formatEur(leak.claimCents)}
Evidence to add before filing: packaging spec sheet + carton dimensions.
Proposed action: ${leak.type === 'FEE_HIKE' ? 'request a size-tier reassessment and reimbursement review.' : 'request a storage-fee review or create a removal order in Seller Central.'}`}
              </div>
            </>
          )}

          {leak.type === 'RETURN_SPIKE' && (
            <>
              <div className="section-title"><IconSparkles size={13} /> Sample reply drafts · local template</div>
              {sampleReplies(sku?.title ?? 'item').map((r, i) => (
                <div className="ai-reply" key={i}>
                  <div className="who">{r.who}</div>
                  {r.text}
                </div>
              ))}
            </>
          )}
        </div>

        <footer className="drawer-foot">
          {imported ? (
            <>
              <span className="drawer-disclaimer">Recommendations only — MarginPulse does not change your store.</span>
              <button className="btn btn-primary" onClick={onClose}>Close finding</button>
            </>
          ) : (
            <>
              <p className="modal-note">Simulation only — these buttons update the local model and do not contact a marketplace.</p>
              {leak.actions.map((a, i) => (
                <button key={a} className={`btn ${i === 0 ? 'btn-primary' : ''}`} onClick={() => onAction(a)}>
                  {i === 0 && <IconShield size={15} />}
                  {ACTION_LABEL[a]}
                </button>
              ))}
            </>
          )}
        </footer>
      </motion.aside>
    </>
  )
}
