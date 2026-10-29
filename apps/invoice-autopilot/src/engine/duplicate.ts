import type { Extraction, LedgerEntry, DuplicateDetectionResult, DuplicateFieldComparison } from './types'
import { formatEur } from './money'

/**
 * Normalizes vendor name for robust matching across slight variations
 * (e.g., "Torréfaction Lyonnaise SARL" vs "Torrefaction Lyonnaise S.A.R.L.")
 */
export function normalizeSupplier(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/\./g, '') // strip periods so S.A.R.L. -> sarl, Co. -> co
    .replace(/&/g, ' ') // treat & as space separator
    .replace(/\b(gmbh|sarl|srl|kg|ag|ltd|inc|corp|co)\b/gi, '')
    .replace(/[^a-z0-9]/g, '')
    .trim()
}

/**
 * Normalizes invoice number (strips spaces, dashes, slashes, uppercase)
 */
export function normalizeInvoiceNo(no: string): string {
  return no.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

export type DocumentLike = Extraction | LedgerEntry

function getDocValues(doc: DocumentLike) {
  if ('lineItems' in doc) {
    // It is an Extraction
    return {
      docId: doc.docId,
      supplier: doc.supplier.value,
      invoiceNo: doc.invoiceNo.value,
      invoiceDate: doc.invoiceDate.value,
      dueDate: doc.dueDate.value,
      grossCents: doc.grossCents.value,
      netCents: doc.netCents.value,
      vatCents: doc.vatCents.value,
      vatId: doc.vatId.value,
    }
  } else {
    // It is a LedgerEntry
    return {
      docId: doc.docId,
      supplier: doc.supplier,
      invoiceNo: doc.invoiceNo,
      invoiceDate: 'posted',
      dueDate: 'N/A',
      grossCents: doc.grossCents,
      netCents: doc.netCents,
      vatCents: doc.vatCents,
      vatId: '',
    }
  }
}

/**
 * Evaluates whether an incoming invoice duplicates any existing document or ledger entry.
 */
export function detectDuplicate(
  incoming: Extraction,
  existingDocs: DocumentLike[],
): DuplicateDetectionResult {
  const inc = getDocValues(incoming)
  const normIncSupplier = normalizeSupplier(inc.supplier)
  const normIncInvoiceNo = normalizeInvoiceNo(inc.invoiceNo)

  let bestMatch: {
    target: ReturnType<typeof getDocValues>
    confidence: number
    matchType: 'EXACT' | 'FUZZY_SUSPECTED'
    matchedFields: string[]
    divergentFields: string[]
    comparisons: DuplicateFieldComparison[]
  } | null = null

  for (const existing of existingDocs) {
    // Don't compare a document to itself if same reference or same docId (unless comparing DOC-DUPLICATE against DOC-CLEAN)
    if (existing === incoming) continue
    if ('lineItems' in existing && existing.docId === incoming.docId) continue

    const ext = getDocValues(existing)
    const normExtSupplier = normalizeSupplier(ext.supplier)
    const normExtInvoiceNo = normalizeInvoiceNo(ext.invoiceNo)

    const sameSupplier = normIncSupplier.length > 0 && normIncSupplier === normExtSupplier
    const sameInvoiceNo = normIncInvoiceNo.length > 0 && normIncInvoiceNo === normExtInvoiceNo
    const sameGross = inc.grossCents === ext.grossCents
    const sameDate = ext.invoiceDate !== 'posted' && inc.invoiceDate === ext.invoiceDate

    const matchedFields: string[] = []
    const divergentFields: string[] = []

    const comparisons: DuplicateFieldComparison[] = [
      {
        field: 'supplier',
        label: 'Supplier / Vendor',
        incomingValue: inc.supplier,
        existingValue: ext.supplier,
        isMatch: sameSupplier,
      },
      {
        field: 'invoiceNo',
        label: 'Invoice Number',
        incomingValue: inc.invoiceNo,
        existingValue: ext.invoiceNo,
        isMatch: sameInvoiceNo,
      },
      {
        field: 'grossCents',
        label: 'Gross Amount',
        incomingValue: formatEur(inc.grossCents),
        existingValue: formatEur(ext.grossCents),
        isMatch: sameGross,
      },
      {
        field: 'invoiceDate',
        label: 'Invoice Date',
        incomingValue: inc.invoiceDate,
        existingValue: ext.invoiceDate,
        isMatch: sameDate,
      },
    ]

    comparisons.forEach((c) => {
      if (c.isMatch) matchedFields.push(c.field)
      else divergentFields.push(c.field)
    })

    // Exact Duplicate: identical supplier, invoice number, gross amount
    if (sameSupplier && sameInvoiceNo && sameGross) {
      bestMatch = {
        target: ext,
        confidence: 1.0,
        matchType: 'EXACT',
        matchedFields,
        divergentFields,
        comparisons,
      }
      break // Highest possible match found
    }

    // Suspected Duplicate Case 1: Same supplier & same invoice number, but different amount or date
    if (sameSupplier && sameInvoiceNo) {
      const conf = sameGross ? 0.95 : 0.85
      if (!bestMatch || conf > bestMatch.confidence) {
        bestMatch = {
          target: ext,
          confidence: conf,
          matchType: 'FUZZY_SUSPECTED',
          matchedFields,
          divergentFields,
          comparisons,
        }
      }
    }

    // Suspected Duplicate Case 2: Same supplier & same gross & same date, but different invoice number
    if (sameSupplier && sameGross && sameDate) {
      const conf = 0.8
      if (!bestMatch || conf > bestMatch.confidence) {
        bestMatch = {
          target: ext,
          confidence: conf,
          matchType: 'FUZZY_SUSPECTED',
          matchedFields,
          divergentFields,
          comparisons,
        }
      }
    }
  }

  if (bestMatch && bestMatch.confidence >= 0.8) {
    return {
      isDuplicate: true,
      confidence: bestMatch.confidence,
      matchType: bestMatch.matchType,
      matchedWithDocId: bestMatch.target.docId,
      matchedWithInvoiceNo: bestMatch.target.invoiceNo,
      matchedWithSupplier: bestMatch.target.supplier,
      matchedWithGrossCents: bestMatch.target.grossCents,
      matchedWithDate: bestMatch.target.invoiceDate,
      fields: bestMatch.comparisons,
      matchedFields: bestMatch.matchedFields,
      divergentFields: bestMatch.divergentFields,
      remediationAdvice:
        bestMatch.matchType === 'EXACT'
          ? `Exact duplicate detected: An identical invoice (${bestMatch.target.invoiceNo} from ${bestMatch.target.supplier} for ${formatEur(bestMatch.target.grossCents)}) already exists in the system. Rejecting recommended to prevent double payment.`
          : `Suspected duplicate: Matches existing invoice on ${bestMatch.matchedFields.join(', ')}. Review visual diff before approving.`,
    }
  }

  return {
    isDuplicate: false,
    confidence: 0,
    matchType: 'NONE',
    fields: [],
    matchedFields: [],
    divergentFields: [],
    remediationAdvice: 'No duplicate detected. Safe to process.',
  }
}
