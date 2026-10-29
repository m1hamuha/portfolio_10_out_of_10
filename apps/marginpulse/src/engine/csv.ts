// CSV import — pure, framework-free.
//
// Turns a real seller's catalogue export into the engine's Sku[] so the SAME
// dashboard, detector and reducers run on real numbers. Money columns are read
// in euros and stored as integer cents. Header matching is tolerant (synonyms,
// case/space/underscore-insensitive) so a messy Seller-Central / spreadsheet
// export still maps cleanly. Bad rows are skipped with a human-readable warning.

import { unitEconomics } from './detect'
import type { CostInput, Marketplace, Sku, Store } from './types'

export interface CsvResult {
  skus: Sku[]
  warnings: string[]
  /** Data rows seen (excluding the header). */
  rowsSeen: number
}

export interface CsvInput {
  name: string
  text: string
}

export interface CsvBundleResult extends CsvResult {
  channels: string[]
  filesSeen: number
}

export interface CoverageSummary {
  scorePct: number
  provided: string[]
  missing: string[]
}

export const MAX_CSV_FILE_BYTES = 2 * 1024 * 1024
export const MAX_CSV_TEXT_CHARS = 2_000_000
export const MAX_CSV_DATA_ROWS = 10_000

// Canonical field → accepted header aliases (normalised: lower-case, no spaces/underscores/hyphens).
const ALIASES: Record<string, string[]> = {
  id: ['sku', 'skuid', 'sellersku', 'msku', 'id', 'itemid'],
  variant: ['variantid', 'variant', 'variant sku', 'variantsku'],
  asin: ['asin', 'fnsku', 'productid'],
  title: ['title', 'name', 'productname', 'product', 'itemname', 'description'],
  marketplace: ['marketplace', 'market', 'country', 'countrycode', 'site', 'store'],
  channel: ['channel', 'saleschannel', 'platform', 'source'],
  category: ['category', 'cat', 'producttype', 'type'],
  cost: ['cost', 'costprice', 'landedcost', 'cogs', 'unitcost', 'buyprice'],
  price: ['price', 'unitprice', 'averageprice', 'saleprice', 'sellingprice', 'sellprice', 'listprice', 'currentprice'],
  referralPct: ['referralfeepct', 'referralpct', 'referral', 'referralfee', 'commissionpct', 'commission'],
  fbaFee: ['fbafee', 'fba', 'fulfilmentperunit', 'fulfillmentperunit', 'fulfilmentfee', 'fulfillmentfee', 'fbafeeeur'],
  units: ['unitsperday', 'dailyunits', 'salesperday', 'velocity', 'dailysales'],
  unitsSold: ['unitssold', 'soldunits', 'quantitysold', 'orders', 'units'],
  periodDays: ['perioddays', 'days', 'analysisdays', 'reportingdays'],
  returnPct: ['returnratepct', 'returnrate', 'returnspct', 'returns', 'returnpct'],
  shippingPerUnit: ['shippingperunit', 'deliveryperunit', 'outboundshippingperunit', 'shippingcostperunit'],
  shippingTotal: ['shippingtotal', 'deliverytotal', 'shippingcosttotal'],
  discountPerUnit: ['discountperunit', 'discountsperunit'],
  discountTotal: ['discounttotal', 'discountstotal', 'discounts'],
  adSpendPerUnit: ['adspendperunit', 'advertisingperunit', 'adcostperunit', 'ppcperunit'],
  adSpendTotal: ['adspendtotal', 'advertisingtotal', 'adcosttotal', 'ppctotal', 'adspend'],
  paymentFeePerUnit: ['paymentfeeperunit', 'transactionfeeperunit', 'processingfeeperunit'],
  paymentFeeTotal: ['paymentfeestotal', 'transactionfeestotal', 'processingfeestotal'],
  marketplaceFeePerUnit: ['marketplacefeeperunit', 'sellingfeeperunit', 'platformfeeperunit'],
  marketplaceFeeTotal: ['marketplacefeestotal', 'sellingfeestotal', 'platformfeestotal'],
  refundPerUnit: ['refundperunit', 'returncostperunit', 'refundcostperunit'],
  refundTotal: ['refundstotal', 'returncosttotal', 'refundcosttotal', 'refunds'],
  vatPerUnit: ['vatperunit', 'taxperunit', 'vatamountperunit'],
  vatTotal: ['vattotal', 'taxtotal', 'vatamounttotal'],
  vatRate: ['vatratepct', 'vatrate', 'taxratepct', 'taxrate'],
  expectedVatRate: ['expectedvatratepct', 'expectedvatrate', 'correctvatratepct'],
  priceIncludesVat: ['priceincludesvat', 'vatincluded', 'grossprice'],
  otherCostPerUnit: ['othercostperunit', 'othercostsperunit'],
  otherCostTotal: ['othercosttotal', 'othercoststotal'],
  inventory: ['inventory', 'inventoryunits', 'stock', 'qty', 'quantity', 'units onhand', 'onhand', 'fbainventory'],
  buyBox: ['buybox', 'buyboxwon', 'hasbuybox', 'buyboxwinner'],
  repricer: ['repricer', 'repriceractive', 'repricing', 'repriceron'],
}

const norm = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, '')

type CsvDelimiter = ',' | ';' | '\t'

function detectDelimiter(line: string): CsvDelimiter {
  const counts = new Map<CsvDelimiter, number>([[',', 0], [';', 0], ['\t', 0]])
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') i++
      else inQuotes = !inQuotes
    } else if (!inQuotes && counts.has(c as CsvDelimiter)) {
      const delimiter = c as CsvDelimiter
      counts.set(delimiter, (counts.get(delimiter) ?? 0) + 1)
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? ','
}

export interface CsvTable {
  headers: string[]
  rows: string[][]
}

/** Read a small flat CSV/TSV export into headers and rows. */
export function parseCsvTable(text: string): CsvTable {
  const lines = text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').split('\n').filter((line) => line.trim())
  if (lines.length === 0) return { headers: [], rows: [] }
  const delimiter = detectDelimiter(lines[0])
  return {
    headers: parseCsvLine(lines[0], delimiter),
    rows: lines.slice(1).map((line) => parseCsvLine(line, delimiter)),
  }
}

/** Parse a single CSV line honouring double-quoted fields and "" escapes. */
export function parseCsvLine(line: string, delimiter: CsvDelimiter = detectDelimiter(line)): string[] {
  const out: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++ }
        else inQuotes = false
      } else cur += c
    } else if (c === '"') inQuotes = true
    else if (c === delimiter) { out.push(cur); cur = '' }
    else cur += c
  }
  out.push(cur)
  return out.map((s) => s.trim())
}

/** Split CSV text into logical records while preserving newlines inside quoted fields. */
function splitCsvRecords(text: string): { records: string[]; unclosedQuote: boolean } {
  const records: string[] = []
  let record = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (c === '"') {
      record += c
      if (inQuotes && text[i + 1] === '"') record += text[++i]
      else inQuotes = !inQuotes
    } else if (c === '\n' && !inQuotes) {
      if (record.trim()) records.push(record)
      record = ''
    } else record += c
  }
  if (record.trim()) records.push(record)
  return { records, unclosedQuote: inQuotes }
}

/** Parse a euro-denominated money string into integer cents. Tolerant of €, spaces, and , / . decimals. */
export function parseMoneyEuros(raw: string): number | null {
  let s = raw.replace(/[€$£\s]/g, '').trim()
  if (!s) return null
  const hasDot = s.includes('.')
  const hasComma = s.includes(',')
  if (hasDot && hasComma) {
    // The last separator is the decimal; the other groups thousands.
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) s = s.replace(/\./g, '').replace(',', '.')
    else s = s.replace(/,/g, '')
  } else if (hasComma) {
    // Comma alone: decimal if it looks like "12,34", else thousands.
    s = /,\d{1,2}$/.test(s) ? s.replace(',', '.') : s.replace(/,/g, '')
  } else if (hasDot && /^[-+]?\d{1,3}(?:\.\d{3})+$/.test(s)) {
    // Dot alone with complete three-digit groups is thousands (for example 1.234).
    s = s.replace(/\./g, '')
  }
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(s)) return null
  const n = Number(s)
  const cents = Math.round(n * 100)
  if (!Number.isFinite(n) || Math.abs(n) > 1_000_000_000 || !Number.isSafeInteger(cents)) return null
  return cents
}

function parseNumber(raw: string, max = 1_000_000_000): number | null {
  const s = raw.replace(/[%\s]/g, '').replace(',', '.')
  if (!s || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(s)) return null
  const n = Number(s)
  return Number.isFinite(n) && Math.abs(n) <= max ? n : null
}

function parseQuantity(raw: string, max = 1_000_000_000): number | null {
  let s = raw.replace(/\s/g, '')
  if (!s) return null
  if (/^[+-]?\d{1,3}([.,]\d{3})+$/.test(s)) s = s.replace(/[.,]/g, '')
  else s = s.replace(',', '.')
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(s)) return null
  const n = Number(s)
  return Number.isFinite(n) && Math.abs(n) <= max ? n : null
}

function parseBool(raw: string, dflt: boolean): boolean {
  const s = raw.toLowerCase().trim()
  if (['true', '1', 'yes', 'y', 'won', 'active', 'on'].includes(s)) return true
  if (['false', '0', 'no', 'n', 'lost', 'inactive', 'off'].includes(s)) return false
  return dflt
}

function normMarketplace(raw: string): Marketplace {
  const s = raw.toLowerCase().replace(/[^a-z]/g, '')
  if (s.startsWith('fr') || s.includes('france')) return 'FR'
  if (s.startsWith('it') || s.includes('ital')) return 'IT'
  if (s.startsWith('uk') || s.startsWith('gb') || s.includes('unitedkingdom')) return 'UK'
  if (s.startsWith('es') || s.includes('spain')) return 'ES'
  if (s.startsWith('nl') || s.includes('netherlands')) return 'NL'
  if (s.startsWith('pt') || s.includes('portugal')) return 'PT'
  if (s.startsWith('de') || s.includes('german')) return 'DE'
  return raw.trim().toUpperCase() || 'DE'
}

/** Map header row → { canonicalField: columnIndex }. */
function mapHeaders(headers: string[]): Record<string, number> {
  const normed = headers.map(norm)
  const map: Record<string, number> = {}
  for (const [field, aliases] of Object.entries(ALIASES)) {
    const normedAliases = aliases.map(norm)
    const idx = normed.findIndex((h) => normedAliases.includes(h))
    if (idx !== -1) map[field] = idx
  }
  return map
}

interface ParseCsvOptions {
  defaultChannel?: string
  sourceFile?: string
}

const inferChannel = (name: string): string => {
  const value = name.toLowerCase()
  if (value.includes('amazon')) return 'Amazon'
  if (value.includes('shopify')) return 'Shopify'
  if (value.includes('woocommerce') || value.includes('woo-commerce')) return 'WooCommerce'
  if (value.includes('ebay')) return 'eBay'
  if (value.includes('etsy')) return 'Etsy'
  return name.replace(/\.[^.]+$/, '').trim() || 'Store'
}

export function parseCsv(text: string, options: ParseCsvOptions = {}): CsvResult {
  const warnings: string[] = []
  if (text.length > MAX_CSV_TEXT_CHARS) {
    return { skus: [], warnings: ['CSV is too large. Keep it under 2 MB.'], rowsSeen: 0 }
  }
  const { records: lines, unclosedQuote } = splitCsvRecords(text.replace(/\r\n?/g, '\n'))
  if (unclosedQuote) {
    return { skus: [], warnings: ['CSV has an unclosed quoted field. Close the quote and import it again.'], rowsSeen: 0 }
  }
  if (lines.length < 2) {
    return { skus: [], warnings: ['CSV is empty or has no data rows.'], rowsSeen: 0 }
  }

  if (lines.length - 1 > MAX_CSV_DATA_ROWS) {
    return { skus: [], warnings: [`CSV has too many rows. Keep it to ${MAX_CSV_DATA_ROWS.toLocaleString()} data rows or fewer.`], rowsSeen: lines.length - 1 }
  }

  const delimiter = detectDelimiter(lines[0])
  const headers = parseCsvLine(lines[0], delimiter)
  const col = mapHeaders(headers)
  if (col.price === undefined || col.cost === undefined) {
    warnings.push('Could not find required "price" and "cost" columns. Expected headers like: sku, title, cost, price, fba_fee, units_per_day, return_rate_pct, inventory, buybox.')
    return { skus: [], warnings, rowsSeen: lines.length - 1 }
  }

  const get = (cells: string[], field: string): string =>
    col[field] !== undefined ? (cells[col[field]] ?? '') : ''

  const skus: Sku[] = []
  const seenIds = new Set<string>()
  let safeModelBudget = 0
  let rowsSeen = 0
  for (let i = 1; i < lines.length; i++) {
    rowsSeen++
    const cells = parseCsvLine(lines[i], delimiter)
    const rowNo = i + 1

    const priceCents = parseMoneyEuros(get(cells, 'price'))
    const costCents = parseMoneyEuros(get(cells, 'cost'))
    if (priceCents === null || priceCents <= 0) { warnings.push(`Row ${rowNo}: missing/invalid price — skipped.`); continue }
    if (costCents === null || costCents < 0) { warnings.push(`Row ${rowNo}: missing/invalid cost — skipped.`); continue }

    const id = get(cells, 'id').trim() || `SKU-${String(skus.length + 1).padStart(3, '0')}`
    const variantId = get(cells, 'variant').trim()
    const channel = get(cells, 'channel').trim() || options.defaultChannel || (
      get(cells, 'asin').trim() || col.fbaFee !== undefined || col.referralPct !== undefined ? 'Amazon' : 'Store'
    )
    const rowKey = `${channel}:${id}${variantId ? `:${variantId}` : ''}`
    if (seenIds.has(rowKey)) {
      warnings.push(`Row ${rowNo}: duplicate SKU "${id}" — skipped.`)
      continue
    }
    const referralPct = parseNumber(get(cells, 'referralPct'), 100)
    const fbaCents = parseMoneyEuros(get(cells, 'fbaFee'))
    const dailyUnits = parseNumber(get(cells, 'units'), 1_000_000)
    const importedUnits = parseNumber(get(cells, 'unitsSold'), 1_000_000_000)
    const importedPeriod = parseNumber(get(cells, 'periodDays'), 100_000)
    const periodDays = importedPeriod !== null && importedPeriod > 0 ? importedPeriod : 1
    const unitsSold = importedUnits !== null && importedUnits >= 0
      ? importedUnits
      : dailyUnits !== null && dailyUnits >= 0 ? dailyUnits * periodDays : 1
    const unitsPerDay = dailyUnits !== null && dailyUnits >= 0
      ? dailyUnits
      : unitsSold / periodDays
    const returnPct = parseNumber(get(cells, 'returnPct'), 100)
    const inventory = parseQuantity(get(cells, 'inventory'), 1_000_000_000)
    const modelUnits = unitsPerDay !== null && unitsPerDay >= 0 ? Math.round(unitsPerDay * 10_000) / 10_000 : 1
    const modelInventory = inventory !== null && inventory >= 0 ? Math.round(inventory) : 0
    const moneyMagnitude = Math.abs(priceCents) + Math.abs(costCents) + Math.abs(fbaCents ?? 0)
    const rowModelBudget = Math.ceil(
      moneyMagnitude * Math.max(modelUnits, 1) * 120 + modelInventory * 1_000,
    )
    if (!Number.isSafeInteger(rowModelBudget) || rowModelBudget > Number.MAX_SAFE_INTEGER - safeModelBudget) {
      warnings.push(`Row ${rowNo}: numeric values are too large for safe calculations — skipped.`)
      continue
    }
    safeModelBudget += rowModelBudget
    seenIds.add(rowKey)

    const perUnitCost = (perUnitField: string, totalField: string): number | undefined => {
      const perUnit = parseMoneyEuros(get(cells, perUnitField))
      if (perUnit !== null && perUnit >= 0) return perUnit
      const total = parseMoneyEuros(get(cells, totalField))
      if (total !== null && total >= 0 && unitsSold > 0) return Math.round(total / unitsSold)
      return undefined
    }

    const shippingCents = perUnitCost('shippingPerUnit', 'shippingTotal')
    const discountCents = perUnitCost('discountPerUnit', 'discountTotal')
    const adSpendCents = perUnitCost('adSpendPerUnit', 'adSpendTotal')
    const paymentFeeCents = perUnitCost('paymentFeePerUnit', 'paymentFeeTotal')
    const marketplaceFeeCents = perUnitCost('marketplaceFeePerUnit', 'marketplaceFeeTotal')
    const returnCostCents = perUnitCost('refundPerUnit', 'refundTotal')
    const otherCostCents = perUnitCost('otherCostPerUnit', 'otherCostTotal')
    const vatRatePct = parseNumber(get(cells, 'vatRate')) ?? undefined
    const expectedVatRatePct = parseNumber(get(cells, 'expectedVatRate')) ?? undefined
    const actualVatCents = perUnitCost('vatPerUnit', 'vatTotal')
    const priceIncludesVat = parseBool(get(cells, 'priceIncludesVat'), false)
    const vatCents = actualVatCents ?? (
      vatRatePct !== undefined && vatRatePct >= 0 && priceIncludesVat
        ? Math.round(priceCents * vatRatePct / (100 + vatRatePct))
        : undefined
    )

    const hasAnyColumn = (...fields: string[]) => fields.some((field) => col[field] !== undefined)
    const providedFields: CostInput[] = []
    if (hasAnyColumn('shippingPerUnit', 'shippingTotal')) providedFields.push('shipping')
    if (hasAnyColumn('discountPerUnit', 'discountTotal')) providedFields.push('discounts')
    if (hasAnyColumn('adSpendPerUnit', 'adSpendTotal')) providedFields.push('advertising')
    if (hasAnyColumn('paymentFeePerUnit', 'paymentFeeTotal')) providedFields.push('paymentFees')
    if (hasAnyColumn('marketplaceFeePerUnit', 'marketplaceFeeTotal', 'referralPct')) providedFields.push('marketplaceFees')
    if (hasAnyColumn('fbaFee')) providedFields.push('fulfilment')
    if (hasAnyColumn('refundPerUnit', 'refundTotal')) providedFields.push('refunds')
    if (hasAnyColumn('vatPerUnit', 'vatTotal') || (hasAnyColumn('vatRate') && priceIncludesVat)) providedFields.push('vat')
    if (hasAnyColumn('otherCostPerUnit', 'otherCostTotal')) providedFields.push('otherCosts')


    skus.push({
      id,
      sourceSku: id,
      variantId: variantId || undefined,
      channel,
      sourceFile: options.sourceFile,
      asin: get(cells, 'asin').trim() || id,
      title: get(cells, 'title').trim() || id,
      marketplace: normMarketplace(get(cells, 'marketplace')),
      category: get(cells, 'category').trim() || 'Uncategorised',
      costCents,
      priceCents,
      priceFloorCents: null,
      referralFeePct: referralPct !== null && referralPct >= 0 ? referralPct : 0,
      fbaFeeCents: fbaCents !== null && fbaCents >= 0 ? fbaCents : 0,
      unitsPerDay: modelUnits,
      unitsSold,
      periodDays,
      returnRatePct: returnPct !== null && returnPct >= 0 ? returnPct : 0,
      shippingCents,
      discountCents,
      adSpendCents,
      paymentFeeCents,
      marketplaceFeeCents,
      returnCostCents,
      vatCents,
      otherCostCents,
      vatRatePct,
      expectedVatRatePct,
      providedFields,
      inventoryUnits: modelInventory,
      buyBoxWon: parseBool(get(cells, 'buyBox'), true),
      repricerActive: parseBool(get(cells, 'repricer'), false),
    })
  }

  if (skus.length === 0 && warnings.length === 0) warnings.push('No valid SKU rows found.')
  return { skus, warnings, rowsSeen }
}

/** Parse several channel exports while preserving duplicate merchant SKUs as separate rows. */
export function parseCsvBundle(inputs: CsvInput[]): CsvBundleResult {
  const skus: Sku[] = []
  const warnings: string[] = []
  let rowsSeen = 0
  const usedIds = new Map<string, number>()

  for (const input of inputs) {
    const defaultChannel = inferChannel(input.name)
    const result = parseCsv(input.text, { defaultChannel, sourceFile: input.name })
    rowsSeen += result.rowsSeen
    warnings.push(...result.warnings.map((warning) => `${input.name}: ${warning}`))
    for (const row of result.skus) {
      const rawSku = row.sourceSku ?? row.id
      const base = `${row.channel ?? defaultChannel}:${rawSku}${row.variantId ? `:${row.variantId}` : ''}`
      const seen = usedIds.get(base) ?? 0
      usedIds.set(base, seen + 1)
      skus.push({ ...row, id: seen === 0 ? base : `${base}:${seen + 1}` })
    }
  }

  const channels = [...new Set(skus.map((row) => row.channel ?? 'Store'))].sort()
  return { skus, warnings, rowsSeen, channels, filesSeen: inputs.length }
}

const COVERAGE_FIELDS: { key: CostInput; label: string }[] = [
  { key: 'advertising', label: 'Advertising' },
  { key: 'shipping', label: 'Shipping' },
  { key: 'discounts', label: 'Discounts' },
  { key: 'refunds', label: 'Refunds' },
  { key: 'paymentFees', label: 'Payment fees' },
  { key: 'marketplaceFees', label: 'Marketplace fees' },
  { key: 'fulfilment', label: 'Fulfilment' },
  { key: 'vat', label: 'VAT' },
]

/** Coverage is based on columns supplied by the client; an explicit zero still counts as supplied. */
export function summarizeCoverage(skus: Sku[]): CoverageSummary {
  if (skus.length === 0) {
    return { scorePct: 0, provided: [], missing: COVERAGE_FIELDS.map((field) => field.label) }
  }
  const provided = COVERAGE_FIELDS
    .filter((field) => skus.every((sku) => sku.providedFields?.includes(field.key)))
    .map((field) => field.label)
  const missing = COVERAGE_FIELDS
    .filter((field) => !skus.every((sku) => sku.providedFields?.includes(field.key)))
    .map((field) => field.label)
  const observations = skus.reduce(
    (count, sku) => count + COVERAGE_FIELDS.filter((field) => sku.providedFields?.includes(field.key)).length,
    0,
  )
  return {
    scorePct: Math.round((observations / (skus.length * COVERAGE_FIELDS.length)) * 100),
    provided,
    missing,
  }
}

/** A blank template (header + two illustrative rows) the user can download and fill in. */
export const TEMPLATE_CSV = `sku,variant_id,title,channel,marketplace,period_days,units_sold,unit_price,unit_cost,shipping_per_unit,discount_per_unit,ad_spend_total,payment_fees_total,marketplace_fees_total,fulfilment_per_unit,refunds_total,return_rate_pct,vat_rate_pct,expected_vat_rate_pct,price_includes_vat,inventory,buybox,repricer
SKU-001,BLUE,Example Duvet Cover,Shopify,DE,30,180,39.90,18.50,3.20,0.50,620.00,143.00,0,0,310.00,4.0,19,19,true,120,true,false
SKU-001,BLUE,Example Duvet Cover,Amazon,DE,30,95,41.90,18.50,0,0,480.00,0,597.00,3.20,180.00,6.0,19,19,true,70,true,false`

/**
 * A realistic 16-SKU catalogue that exercises every detector (thin margin,
 * below-cost repricer race, return spikes, lost Buy Box, overstock, fee bloat),
 * so the "import sample data" path produces a compelling, varied set of leaks.
 */
export const SAMPLE_CSV = `sku,title,marketplace,category,cost,price,referral_fee_pct,fba_fee,units_per_day,return_rate_pct,inventory,buybox,repricer
HOM-001,Organic Cotton Duvet King,DE,Bed Linen,21.00,29.90,15,3.40,14,4.2,160,true,true
HOM-002,Linen Waffle Towel Set,FR,Bath Towels,12.50,34.90,15,2.90,9,13.5,90,true,false
HOM-003,Merino Throw Blanket,DE,Throws & Blankets,28.00,69.00,15,4.10,6,3.1,30,false,false
HOM-004,Percale Fitted Sheet Double,IT,Bed Linen,8.20,15.90,15,2.40,11,5.0,55,false,true
HOM-005,Bamboo Bath Mat,DE,Bath Towels,6.40,12.50,15,5.80,4,7.2,38,true,false
HOM-006,Sateen Pillowcase Pair,FR,Bed Linen,5.10,13.90,15,2.20,18,4.4,210,true,true
HOM-007,Cushion Cover Velvet 50x50,DE,Cushions,4.30,9.90,15,2.10,7,16.0,75,true,false
HOM-008,Tea Towel Set of 4,IT,Kitchen Textiles,3.10,8.50,15,2.60,2,2.5,420,true,false
HOM-009,Blackout Curtain 140x200,DE,Curtains,17.80,32.00,15,6.90,5,6.5,48,true,false
HOM-010,Wool Area Rug 120x170,FR,Rugs,44.00,119.00,15,9.50,3,3.8,18,true,false
HOM-011,Table Runner Linen,IT,Table Linen,6.70,15.00,15,2.30,1,3.0,140,false,false
HOM-012,Quilted Bedspread King,DE,Bed Linen,33.50,54.00,15,7.20,8,11.0,62,true,true
HOM-013,Microfibre Cleaning Cloths 10pk,DE,Kitchen Textiles,2.20,6.90,15,2.80,1,2.0,520,true,false
HOM-014,Faux Fur Cushion,FR,Cushions,7.90,16.50,15,2.50,6,9.0,44,false,true
HOM-015,Hand Towel Egyptian Cotton,DE,Bath Towels,5.60,11.90,15,2.40,12,5.5,80,true,true
HOM-016,Throw Pillow Insert 45x45,IT,Cushions,3.40,7.20,15,2.30,4,3.5,300,true,false`

const REPORT_LEAK: Record<string, string> = {
  BELOW_FLOOR: 'Below margin floor',
  FEE_HIKE: 'Fees eating margin',
  RETURN_SPIKE: 'Return-rate spike',
  BUYBOX_LOST: 'Buy Box lost',
  STORAGE_FEE: 'Storage-fee risk',
  PPC_BLEED: 'Ad overspend',
  VAT_MISMATCH: 'VAT mismatch',
}
const REPORT_ACTION: Record<string, string> = {
  SET_PRICE_FLOOR: 'Set price floor',
  PAUSE_REPRICER: 'Pause repricer',
  DISPUTE_FEE: 'File FBA fee dispute',
  DISPUTE_STORAGE: 'Create removal order',
  RESOLVE_RETURNS: 'Tighten listing + returns rule',
  WIN_BUYBOX: 'Reclaim Buy Box',
  FIX_VAT: 'Correct VAT rate',
  CAP_AD_SPEND: 'Cap ad spend',
  CREATE_RESTOCK_ALERT: 'Create restock alert',
}
const csvCell = (s: string) => (/[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s)
const eur2 = (cents: number) => (cents / 100).toFixed(2)

/** Full profitability handoff: one auditable row per SKU + channel for the imported period. */
export function profitReportCsv(skus: Sku[]): string {
  const header = [
    'Channel', 'Marketplace', 'SKU', 'Variant', 'Title', 'Period_days', 'Units_sold',
    'Revenue_EUR', 'COGS_EUR', 'Shipping_EUR', 'Discounts_EUR', 'Advertising_EUR',
    'Payment_fees_EUR', 'Marketplace_fees_EUR', 'Fulfilment_EUR', 'Refunds_EUR',
    'VAT_EUR', 'Other_costs_EUR', 'Net_profit_EUR', 'Margin_pct', 'Data_coverage_pct',
    'Missing_inputs', 'Source_file',
  ]
  const rows = skus.map((sku) => {
    const economics = unitEconomics(sku)
    const periodDays = sku.periodDays ?? 1
    const units = sku.unitsSold ?? sku.unitsPerDay * periodDays
    const total = (perUnit: number) => Math.round(perUnit * units)
    const revenue = total(sku.priceCents)
    const profit = total(economics.contribution)
    const coverage = summarizeCoverage([sku])
    return [
      sku.channel ?? 'Store',
      sku.marketplace,
      sku.sourceSku ?? sku.id,
      sku.variantId ?? '',
      sku.title,
      periodDays,
      Number.isInteger(units) ? units : units.toFixed(2),
      eur2(revenue),
      eur2(total(sku.costCents)),
      eur2(total(economics.shipping)),
      eur2(total(economics.discount)),
      eur2(total(economics.ppc)),
      eur2(total(economics.paymentFee)),
      eur2(total(economics.referral + economics.marketplaceFee)),
      eur2(total(economics.fba)),
      eur2(total(economics.returnCost)),
      eur2(total(economics.vat)),
      eur2(total(economics.otherCost)),
      eur2(profit),
      revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : '0.0',
      coverage.scorePct,
      coverage.missing.join('; '),
      sku.sourceFile ?? '',
    ].map((value) => csvCell(String(value))).join(',')
  })
  return [header.join(','), ...rows].join('\n')
}

/** Export the active leaks as a CSV "action plan" the seller can keep (euros, 2dp). */
export function leaksReportCsv(store: Store): string {
  const skuById = new Map(store.skus.map((k) => [k.id, k]))
  const active = store.leaks
    .filter((l) => l.status === 'active')
    .sort((a, b) => b.ratePerDayCents - a.ratePerDayCents)
  const header = ['SKU', 'ASIN', 'Marketplace', 'Title', 'Leak', 'Severity', 'EUR_per_day', 'EUR_per_month', 'Recommended_action', 'Claimable_EUR']
  const rows = active.map((l) => {
    const k = skuById.get(l.skuId)
    return [
      l.skuId,
      k?.asin ?? '',
      k?.marketplace ?? '',
      k?.title ?? '',
      REPORT_LEAK[l.type] ?? l.type,
      l.severity,
      eur2(l.ratePerDayCents),
      eur2(l.ratePerDayCents * 30),
      REPORT_ACTION[l.actions[0]] ?? l.actions[0],
      l.claimCents ? eur2(l.claimCents) : '',
    ]
      .map((v) => csvCell(String(v)))
      .join(',')
  })
  return [header.join(','), ...rows].join('\n')
}
