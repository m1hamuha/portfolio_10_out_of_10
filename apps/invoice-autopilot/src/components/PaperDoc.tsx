import type { Extraction } from '../engine'
import { formatEur } from '../engine'

// A stylised "paper" rendering of each invoice, so the scan happens over a
// believable bright document on the dark desk. Layout intentionally mirrors the
// normalized field boxes in documents.ts (percentages), so overlay boxes land
// on the right text. Purely presentational.

const COPY: Record<
  string,
  {
    head: string
    sub: string
    addr: string
    labels: { invoiceNo: string; date: string; due: string; net: string; vat: string; gross: string; vatId: string }
    cols: { desc: string; qty: string; unit: string; total: string }
  }
> = {
  DE: {
    head: 'RECHNUNG',
    sub: 'Bauer Industriebedarf GmbH',
    addr: 'Industriestraße 14 · 70565 Stuttgart · Deutschland',
    labels: { invoiceNo: 'Rechnungs-Nr.', date: 'Datum', due: 'Fällig am', net: 'Nettobetrag', vat: 'zzgl. USt', gross: 'Gesamtbetrag', vatId: 'USt-IdNr.' },
    cols: { desc: 'Beschreibung', qty: 'Menge', unit: 'Einzelpreis', total: 'Gesamt' },
  },
  FR: {
    head: 'FACTURE',
    sub: 'Torréfaction Lyonnaise SARL',
    addr: '12 rue de la Soie · 69100 Villeurbanne · France',
    labels: { invoiceNo: 'Facture N°', date: 'Date', due: 'Échéance', net: 'Total HT', vat: 'TVA', gross: 'Total TTC', vatId: 'N° TVA' },
    cols: { desc: 'Désignation', qty: 'Qté', unit: 'P.U. HT', total: 'Montant' },
  },
  IT: {
    head: 'FATTURA',
    sub: 'Alimentari Toscana S.r.l.',
    addr: 'Via dei Mille 8 · 50123 Firenze · Italia',
    labels: { invoiceNo: 'Fattura N.', date: 'Data', due: 'Scadenza', net: 'Imponibile', vat: 'IVA', gross: 'Totale', vatId: 'P. IVA' },
    cols: { desc: 'Descrizione', qty: 'Q.tà', unit: 'Prezzo', total: 'Importo' },
  },
}

export function PaperDoc({ ext }: { ext: Extraction }) {
  const t = COPY[ext.country] ?? COPY.DE
  const supplierName = ext.supplier.value || t.sub
  const initials = supplierName.split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('')

  return (
    <div className="paper-inner" aria-label={`${t.head} ${ext.invoiceNo.value}`}>
      <div className="paper-watermark">{ext.country === 'IT' ? 'FATTURA ELETTRONICA' : ext.country === 'FR' ? 'FACTUR-X' : 'KOPIE'}</div>

      <header className="pd-head">
        <div className="pd-brand">
          <div className="pd-logo">{initials}</div>
          <div>
            <div className="pd-title">{t.head}</div>
            <div className="pd-supplier">{supplierName}</div>
            <div className="pd-addr">{t.addr}</div>
          </div>
        </div>
        <div className="pd-meta">
          <div><span>{t.labels.invoiceNo}</span><b className="num">{ext.invoiceNo.value}</b></div>
          <div><span>{t.labels.date}</span><b className="num">{ext.invoiceDate.value}</b></div>
          <div><span>{t.labels.due}</span><b className="num">{ext.dueDate.value}</b></div>
        </div>
      </header>

      <div className="pd-vatid">{t.labels.vatId}: <b className="num">{ext.vatId.value || '(Empty / Missing)'}</b></div>

      <table className="pd-table">
        <thead>
          <tr>
            <th>{t.cols.desc}</th>
            <th className="r">{t.cols.qty}</th>
            <th className="r">{t.cols.unit}</th>
            <th className="r">{t.cols.total}</th>
          </tr>
        </thead>
        <tbody>
          {ext.lineItems.map((l, i) => (
            <tr key={i}>
              <td>{l.desc}</td>
              <td className="r num">{l.qty}</td>
              <td className="r num">{formatEur(l.unitPriceCents)}</td>
              <td className="r num">{formatEur(l.lineTotalCents)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pd-totals">
        <div className="pd-trow"><span>{t.labels.net}</span><b className="num">{formatEur(ext.netCents.value)}</b></div>
        <div className="pd-trow"><span>{t.labels.vat} {ext.vatRatePct.value} %</span><b className="num">{formatEur(ext.vatCents.value)}</b></div>
        <div className="pd-trow grand"><span>{t.labels.gross}</span><b className="num">{formatEur(ext.grossCents.value)}</b></div>
      </div>

      <div className="pd-stamp">{ext.country === 'DE' ? 'Zahlbar ohne Abzug · Vielen Dank' : ext.country === 'FR' ? 'Merci de votre confiance' : 'Pagamento a 30 giorni'}</div>
    </div>
  )
}
