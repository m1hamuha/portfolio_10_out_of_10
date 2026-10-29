import { useMemo } from 'react'
import { useStore, DOCS } from '../store/useStore'
import { Gloss, type GlossKey } from './Gloss'
import { IconLayers, IconUpload, IconCheck, IconAlert } from './icons'

/** Surface a plain-language gloss when a doc kind name carries jargon. */
function kindGloss(kind: string): GlossKey | null {
  if (kind.includes('Factur-X')) return 'facturx'
  return null
}

export function DocStack() {
  const selectedDoc = useStore((s) => s.selectedDoc)
  const selectDoc = useStore((s) => s.selectDoc)
  const phase = useStore((s) => s.phase)
  const ledger = useStore((s) => s.ledger)
  const postedIds = useMemo(() => new Set(ledger.entries.map((e) => e.docId)), [ledger.entries])
  const scanning = phase === 'scanning'

  return (
    <aside className="docstack">
      <div className="docstack-head">
        <IconLayers size={17} /><h2>Invoices in your inbox</h2>
        <span className="count">{DOCS.length}</span>
      </div>

      <div className="docstack-list">
        {DOCS.map((d) => {
          const active = selectedDoc === d.id
          const posted = postedIds.has(d.id)
          return (
            <div
              key={d.id}
              role="button"
              tabIndex={0}
              className={`docitem ${active ? 'active' : ''} ${posted ? 'done' : ''}`}
              onClick={() => selectDoc(d.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  if (!scanning) selectDoc(d.id)
                }
              }}
              aria-pressed={active}
              aria-disabled={scanning}
            >
              <span className="docthumb" data-doc={d.id}>
                <span className="docthumb-lines">
                  <i /><i /><i /><i /><i />
                </span>
                {posted && <span className="docthumb-badge done"><IconCheck size={12} /></span>}
                {!posted && d.id === 'DOC-1' && <span className="docthumb-badge warn"><IconAlert size={12} /></span>}
              </span>
              <span className="docitem-main">
                <span className="docitem-label"><span aria-hidden="true">{d.flag}</span> {d.label}</span>
                <span className="docitem-kind">
                  {d.kind}
                  {kindGloss(d.kind) && <Gloss k={kindGloss(d.kind)!} />}
                </span>
                <span className={`docitem-note ${posted ? 'done' : ''}`}>{posted ? 'Filed — done' : d.note}</span>
              </span>
            </div>
          )
        })}
      </div>

      <button className="upload-aff" onClick={() => selectDoc('DOC-1')} disabled={scanning}>
        <IconUpload size={18} />
        <div>
          <b>Drop in an invoice</b>
          <span>Loads a sample — nothing leaves your device</span>
        </div>
        <span className="sr-only"> — try the sample upload, loads the German photo</span>
      </button>
    </aside>
  )
}
