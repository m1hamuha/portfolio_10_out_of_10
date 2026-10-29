import { useMemo, useState, type ChangeEvent } from 'react'
import { useStore } from '../store/useStore'
import {
  importRawExports,
  summarizeCoverage,
  detectLeaks,
  formatEur,
  SHOPIFY_SAMPLE_EXPORTS,
  type CsvInput,
} from '../engine'
import { Modal } from './Modal'
import { IconActivity, IconAlert, IconCheck } from './icons'

export function ImportPanel({ onClose }: { onClose: () => void }) {
  const importCatalogue = useStore((state) => state.importCatalogue)
  const [files, setFiles] = useState<CsvInput[]>([])
  const [readError, setReadError] = useState('')

  const parsed = useMemo(() => {
    if (files.length === 0) return null
    const result = importRawExports(files)
    const leaks = detectLeaks(result.skus, 0)
    return {
      ...result,
      leakCount: leaks.length,
      rate: leaks.reduce((sum, leak) => sum + leak.ratePerDayCents, 0),
      coverage: summarizeCoverage(result.skus),
    }
  }, [files])

  const loadSample = () => {
    setFiles(SHOPIFY_SAMPLE_EXPORTS)
    setReadError('')
  }

  const onFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const selected = [...(event.target.files ?? [])]
    event.target.value = ''
    if (selected.length === 0) return
    setReadError('')
    try {
      const next = await Promise.all(selected.map(async (file) => ({ name: file.name, text: await file.text() })))
      setFiles((current) => {
        const names = new Set(next.map((file) => file.name))
        return [...current.filter((file) => !names.has(file.name)), ...next]
      })
    } catch {
      setReadError('We could not read one of those files. Export it again as CSV and retry.')
    }
  }

  const analyze = () => {
    if (!parsed?.readiness.canAnalyze) return
    const label = parsed.channels.length > 1 ? 'Multi-channel analysis' : `${parsed.channels[0]} analysis`
    importCatalogue(parsed.skus, label)
  }

  const canAnalyse = parsed?.readiness.canAnalyze ?? false

  return (
    <Modal
      title="Upload your store exports"
      subtitle="MarginPulse recognises the files, joins them by SKU and checks that the profit calculation is ready."
      icon={<IconActivity size={20} />}
      onClose={onClose}
      wide
    >
      <div className="source-guide" aria-label="Supported exports">
        <div>
          <b>Shopify</b>
          <span>Orders CSV + Products CSV with “Cost per item”</span>
        </div>
        <div>
          <b>Amazon</b>
          <span>Settlement report + product costs by SKU</span>
        </div>
        <p>Optional for both: a SKU-level advertising spend CSV.</p>
      </div>

      <div className="import-actions">
        <label className="btn btn-sm btn-primary file-btn">
          Choose export files
          <input type="file" multiple accept=".csv,text/csv,text/plain" onChange={onFiles} />
        </label>
        <button className="btn btn-sm" onClick={loadSample}>Try a Shopify sample</button>
        {files.length > 0 && <button className="btn btn-sm btn-ghost" onClick={() => setFiles([])}>Clear files</button>}
      </div>

      {readError && <ul className="warns" role="alert"><li>{readError}</li></ul>}

      {parsed && (
        <div className="preview">
          <div className="source-list" aria-label="Recognised exports">
            {parsed.sources.map((source) => (
              <div className={`source-row ${source.status}`} key={`${source.name}:${source.kind}`}>
                <span className="source-state" aria-hidden="true">
                  {source.status === 'error' ? <IconAlert size={15} /> : <IconCheck size={15} />}
                </span>
                <span className="source-copy">
                  <b>{source.label}</b>
                  <span>{source.name}</span>
                </span>
                <span className="source-message">{source.message}</span>
              </div>
            ))}
          </div>

          <div className={`readiness ${canAnalyse ? 'ready' : 'blocked'}`} role="status">
            {canAnalyse ? <IconCheck size={18} /> : <IconAlert size={18} />}
            <div>
              <b>{canAnalyse ? 'Ready to analyse' : 'One more file is needed'}</b>
              {canAnalyse ? (
                <p>{parsed.skus.length} product row{parsed.skus.length === 1 ? '' : 's'} matched across {parsed.channels.join(' + ')}.</p>
              ) : (
                <ul>{parsed.readiness.blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}</ul>
              )}
            </div>
          </div>

          {canAnalyse && (
            <>
              <div className={`preview-stat ${parsed.leakCount > 0 ? 'has-leaks' : 'clean'}`}>
                {parsed.leakCount > 0 ? <IconAlert size={16} /> : <IconCheck size={16} />}
                <span>
                  <b className="num">{parsed.leakCount}</b> finding{parsed.leakCount === 1 ? '' : 's'}
                  {parsed.leakCount > 0 && <><span className="sep">·</span><b className="num red">{formatEur(parsed.rate)}/day</b> to review</>}
                </span>
              </div>

              <div className={`coverage ${parsed.coverage.scorePct === 100 ? 'complete' : ''}`}>
                <div><span>Cost data coverage</span><b className="num">{parsed.coverage.scorePct}%</b></div>
                <p>{parsed.coverage.missing.length > 0
                  ? `Not included: ${parsed.coverage.missing.join(', ')}.`
                  : 'All core cost groups are present.'}</p>
              </div>
            </>
          )}

          {(parsed.readiness.notices.length > 0 || parsed.warnings.length > 0) && (
            <ul className="warns">
              {[...parsed.readiness.notices, ...parsed.warnings].map((warning) => <li key={warning}>{warning}</li>)}
            </ul>
          )}
        </div>
      )}

      <p className="modal-note">
        Your files stay in this browser. Missing costs are shown openly and are never guessed.
      </p>

      <div className="modal-foot">
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={analyze} disabled={!canAnalyse}>
          {canAnalyse ? `Analyse ${parsed!.skus.length} product${parsed!.skus.length === 1 ? '' : 's'}` : 'Add required exports'}
        </button>
      </div>
    </Modal>
  )
}
