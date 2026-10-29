import { parseCsv, parseCsvTable, parseMoneyEuros, type CsvInput } from './csv'
import type { CostInput, Marketplace, Sku } from './types'

export type RawSourceKind =
  | 'shopify-orders'
  | 'product-costs'
  | 'amazon-settlement'
  | 'ad-spend'
  | 'woocommerce-orders'
  | 'marginpulse'
  | 'unknown'

export interface RawSourceSummary {
  name: string
  kind: RawSourceKind
  label: string
  status: 'ready' | 'warning' | 'error'
  rows: number
  message: string
}

export interface RawImportReadiness {
  canAnalyze: boolean
  blockers: string[]
  notices: string[]
}

export interface RawImportResult {
  skus: Sku[]
  sources: RawSourceSummary[]
  readiness: RawImportReadiness
  warnings: string[]
  rowsSeen: number
  channels: string[]
}

interface SalesAggregate {
  key: string
  sku: string
  title: string
  channel: 'Shopify' | 'Amazon' | 'WooCommerce'
  marketplace: Marketplace
  sourceFile: string
  units: number
  grossCents: number
  discountCents: number
  refundCents: number
  marketplaceFeesCents: number
  fulfilmentCents: number
  firstDate?: number
  lastDate?: number
  provided: Set<CostInput>
}

interface CostRecord {
  costCents: number
  title?: string
}

const normalise = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '')
const skuKey = (value: string) => value.trim().toUpperCase()

function tableMap(headers: string[]): Map<string, number> {
  return new Map(headers.map((header, index) => [normalise(header), index]))
}

function cell(row: string[], columns: Map<string, number>, ...names: string[]): string {
  for (const name of names) {
    const index = columns.get(normalise(name))
    if (index !== undefined) return row[index]?.trim() ?? ''
  }
  return ''
}

function money(value: string): number {
  return parseMoneyEuros(value) ?? 0
}

function number(value: string): number {
  const parsed = Number(value.replace(/\s/g, '').replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : 0
}

function dateValue(value: string): number | undefined {
  if (!value.trim()) return undefined
  const parsed = Date.parse(value.trim())
  return Number.isFinite(parsed) ? parsed : undefined
}

function includeDate(aggregate: SalesAggregate, value: string) {
  const parsed = dateValue(value)
  if (parsed === undefined) return
  aggregate.firstDate = aggregate.firstDate === undefined ? parsed : Math.min(aggregate.firstDate, parsed)
  aggregate.lastDate = aggregate.lastDate === undefined ? parsed : Math.max(aggregate.lastDate, parsed)
}

function periodDays(aggregate: SalesAggregate): number {
  if (aggregate.firstDate === undefined || aggregate.lastDate === undefined) return 1
  return Math.max(1, Math.floor((aggregate.lastDate - aggregate.firstDate) / 86_400_000) + 1)
}

function marketplaceFrom(value: string): Marketplace {
  const lower = value.toLowerCase()
  if (lower.includes('.fr') || lower === 'fr' || lower.includes('france')) return 'FR'
  if (lower.includes('.it') || lower === 'it' || lower.includes('italy')) return 'IT'
  if (lower.includes('.es') || lower === 'es' || lower.includes('spain')) return 'ES'
  if (lower.includes('.nl') || lower === 'nl' || lower.includes('netherlands')) return 'NL'
  if (lower.includes('.co.uk') || lower === 'uk' || lower === 'gb') return 'UK'
  return 'DE'
}

function preparedTemplate(headers: string[]): boolean {
  const set = new Set(headers.map(normalise))
  const hasPrice = set.has('unitprice') || set.has('price')
  const hasCost = set.has('unitcost') || set.has('cost')
  const hasUnits = set.has('unitssold') || set.has('unitsperday') || set.has('units')
  return hasPrice && hasCost && hasUnits
}

export function detectSourceKind(_name: string, text: string): RawSourceKind {
  const { headers } = parseCsvTable(text)
  const set = new Set(headers.map(normalise))
  const has = (...names: string[]) => names.some((name) => set.has(normalise(name)))

  if (has('Lineitem SKU') && has('Lineitem quantity') && has('Lineitem price') && has('Created at')) {
    return 'shopify-orders'
  }
  if (has('settlement-id') && has('sku') && has('product-sales') && (has('selling-fees') || has('fba-fees'))) {
    return 'amazon-settlement'
  }
  if ((has('Advertised SKU') || has('SKU') || has('Product ID')) && (has('Spend') || has('Ad spend'))) {
    return 'ad-spend'
  }
  if (preparedTemplate(headers)) return 'marginpulse'

  // WooCommerce Detection:
  // Recognizes core WooCommerce Order CSV export and popular export plugins
  const hasWooSku = has('Item SKU', 'Product SKU', 'SKU', 'Order Item SKU', 'item_sku')
  const hasWooQty = has('Item Quantity', 'Quantity', 'Quantity Ordered', 'item_quantity', 'Qty')
  const hasWooPrice = has('Item Price', 'Line Item Price', 'Item Cost', 'Line Total', 'Item Total', 'Line Subtotal', 'Price')
  const hasWooOrderContext = has('Order Number', 'Order ID', 'Order Date', 'Date Completed', 'Order Status', 'Billing Country', 'Payment Method Title', 'Payment Method')

  if (hasWooSku && hasWooQty && (hasWooPrice || hasWooOrderContext)) {
    return 'woocommerce-orders'
  }

  if (has('SKU') && (has('Cost per item') || has('Unit cost') || has('COGS'))) {
    return 'product-costs'
  }
  return 'unknown'
}

const SOURCE_LABEL: Record<RawSourceKind, string> = {
  'shopify-orders': 'Shopify orders',
  'product-costs': 'Product costs',
  'amazon-settlement': 'Amazon settlement',
  'ad-spend': 'Advertising spend',
  'woocommerce-orders': 'WooCommerce orders',
  marginpulse: 'MarginPulse template',
  unknown: 'Unsupported file',
}

function newAggregate(
  key: string,
  sku: string,
  title: string,
  channel: 'Shopify' | 'Amazon' | 'WooCommerce',
  marketplace: Marketplace,
  sourceFile: string,
): SalesAggregate {
  return {
    key,
    sku,
    title: title || sku,
    channel,
    marketplace,
    sourceFile,
    units: 0,
    grossCents: 0,
    discountCents: 0,
    refundCents: 0,
    marketplaceFeesCents: 0,
    fulfilmentCents: 0,
    provided: new Set<CostInput>(),
  }
}

function readShopify(input: CsvInput, sales: Map<string, SalesAggregate>, warnings: string[]) {
  const table = parseCsvTable(input.text)
  const columns = tableMap(table.headers)
  const currencies = new Set<string>()

  for (const row of table.rows) {
    const rawSku = cell(row, columns, 'Lineitem SKU', 'SKU')
    const units = number(cell(row, columns, 'Lineitem quantity', 'Quantity'))
    const price = money(cell(row, columns, 'Lineitem price', 'Price'))
    if (!rawSku || units <= 0 || price <= 0) continue

    const sku = skuKey(rawSku)
    const key = `Shopify:${sku}`
    const country = cell(row, columns, 'Shipping Country', 'Country') || 'DE'
    const aggregate = sales.get(key) ?? newAggregate(key, rawSku.trim(), cell(row, columns, 'Lineitem name', 'Name'), 'Shopify', marketplaceFrom(country), input.name)
    aggregate.units += units
    aggregate.grossCents += price * units

    const discount = money(cell(row, columns, 'Lineitem discount', 'Discount'))
    if (discount > 0) {
      aggregate.discountCents += discount
      aggregate.provided.add('discounts')
    }

    const refund = money(cell(row, columns, 'Refunded Amount', 'Refund amount'))
    if (refund > 0) {
      aggregate.refundCents += refund
      aggregate.provided.add('refunds')
    }

    includeDate(aggregate, cell(row, columns, 'Created at', 'Date'))
    sales.set(key, aggregate)

    const currency = cell(row, columns, 'Currency').toUpperCase()
    if (currency) currencies.add(currency)
  }

  if (currencies.size > 1) {
    warnings.push(`${input.name}: multiple currencies detected; please segment currency exports.`)
  }
  if ([...currencies].some((currency) => currency !== 'EUR' && currency !== '')) {
    warnings.push(`${input.name}: only EUR orders are supported in the MVP.`)
  }
}

function readAmazon(input: CsvInput, sales: Map<string, SalesAggregate>) {
  const table = parseCsvTable(input.text)
  const columns = tableMap(table.headers)

  for (const row of table.rows) {
    const type = cell(row, columns, 'transaction-type', 'type').toLowerCase()
    const rawSku = cell(row, columns, 'sku')
    if (!rawSku) continue

    const sku = skuKey(rawSku)
    const key = `Amazon:${sku}`
    const marketplace = marketplaceFrom(cell(row, columns, 'marketplace-name', 'marketplace'))
    const aggregate = sales.get(key) ?? newAggregate(key, rawSku.trim(), cell(row, columns, 'product-description', 'description'), 'Amazon', marketplace, input.name)
    const qty = number(cell(row, columns, 'quantity'))
    const salesAmount = money(cell(row, columns, 'product-sales', 'amount'))
    const sellingFees = Math.abs(money(cell(row, columns, 'selling-fees')))
    const fbaFees = Math.abs(money(cell(row, columns, 'fba-fees')))

    if (type.includes('refund')) {
      aggregate.refundCents += Math.abs(salesAmount)
      aggregate.provided.add('refunds')
    } else {
      if (qty > 0) aggregate.units += qty
      if (salesAmount > 0) aggregate.grossCents += salesAmount
    }

    if (sellingFees > 0) {
      aggregate.marketplaceFeesCents += sellingFees
      aggregate.provided.add('marketplaceFees')
    }
    if (fbaFees > 0) {
      aggregate.fulfilmentCents += fbaFees
      aggregate.provided.add('fulfilment')
    }

    includeDate(aggregate, cell(row, columns, 'posted-date', 'date/time'))
    sales.set(key, aggregate)
  }
}

function readWooCommerce(
  input: CsvInput,
  sales: Map<string, SalesAggregate>,
  costs: Map<string, CostRecord>,
  warnings: string[],
) {
  const table = parseCsvTable(input.text)
  const columns = tableMap(table.headers)
  const currencies = new Set<string>()

  for (const row of table.rows) {
    const rawSku = cell(row, columns, 'Item SKU', 'Product SKU', 'SKU', 'Order Item SKU', 'item_sku')
    const units = number(cell(row, columns, 'Item Quantity', 'Quantity', 'Quantity Ordered', 'item_quantity', 'Qty'))
    const price = money(cell(row, columns, 'Item Price', 'Line Item Price', 'Price', 'Item Subtotal', 'Item Total'))
    if (!rawSku || units <= 0 || price <= 0) continue

    const sku = skuKey(rawSku)
    const key = `WooCommerce:${sku}`
    const country = cell(row, columns, 'Shipping Country', 'Billing Country', 'Country') || 'DE'
    const title = cell(row, columns, 'Item Name', 'Line Item Name', 'Product Name', 'Title') || rawSku

    const aggregate =
      sales.get(key) ??
      newAggregate(
        key,
        rawSku.trim(),
        title,
        'WooCommerce',
        marketplaceFrom(country),
        input.name,
      )

    aggregate.units += units
    aggregate.grossCents += price * units

    // Extract item-level or proportional order discounts
    const discount = money(cell(row, columns, 'Item Discount', 'Discount Amount', 'Order Discount'))
    if (discount > 0) {
      aggregate.discountCents += discount
      aggregate.provided.add('discounts')
    }

    // Extract refunds
    const refund = money(cell(row, columns, 'Order Refund Amount', 'Refund Amount', 'Refunded'))
    if (refund > 0) {
      aggregate.refundCents += refund
      aggregate.provided.add('refunds')
    }

    // Extract outbound shipping
    const shipping = money(cell(row, columns, 'Item Shipping', 'Shipping Cost', 'Order Shipping'))
    if (shipping > 0) {
      aggregate.fulfilmentCents += shipping
      aggregate.provided.add('fulfilment')
      aggregate.provided.add('shipping')
    }

    // Extract payment gateway fee (Stripe, PayPal, etc.)
    const gatewayFee = money(cell(row, columns, 'Payment Gateway Fee', 'Fee Total', 'Stripe Fee', 'PayPal Fee'))
    if (gatewayFee > 0) {
      aggregate.marketplaceFeesCents += gatewayFee
      aggregate.provided.add('paymentFees')
    }

    // Check if line-item includes embedded COGS (from Cost of Goods Sold plugins)
    const embeddedCost = money(cell(row, columns, 'Item Cost', 'Cost of Goods', 'Unit Cost', 'COGS', 'item_cost'))
    if (embeddedCost > 0 && !costs.has(sku)) {
      costs.set(sku, { costCents: embeddedCost, title })
    }

    includeDate(aggregate, cell(row, columns, 'Order Date', 'Date', 'Created at', 'post_date'))
    sales.set(key, aggregate)

    const currency = cell(row, columns, 'Order Currency', 'Currency').toUpperCase()
    if (currency) currencies.add(currency)
  }

  if (currencies.size > 1) {
    warnings.push(`${input.name}: multiple currencies detected; please segment currency exports.`)
  }
  if ([...currencies].some((currency) => currency !== 'EUR' && currency !== '')) {
    warnings.push(`${input.name}: only EUR orders are supported in the MVP.`)
  }
}

function readCosts(input: CsvInput, costs: Map<string, CostRecord>) {
  const table = parseCsvTable(input.text)
  const columns = tableMap(table.headers)
  for (const row of table.rows) {
    const rawSku = cell(row, columns, 'SKU', 'Variant SKU', 'Handle')
    const cost = money(cell(row, columns, 'Cost per item', 'Unit cost', 'COGS'))
    if (!rawSku || cost <= 0) continue
    const sku = skuKey(rawSku)
    costs.set(sku, { costCents: cost, title: cell(row, columns, 'Title', 'Product Name') })
  }
}

function readAds(input: CsvInput, ads: Map<string, number>) {
  const table = parseCsvTable(input.text)
  const columns = tableMap(table.headers)
  for (const row of table.rows) {
    const rawSku = cell(row, columns, 'Advertised SKU', 'SKU', 'Product ID')
    const spend = Math.abs(money(cell(row, columns, 'Spend', 'Ad spend')))
    if (!rawSku || spend <= 0) continue
    const key = skuKey(rawSku)
    ads.set(key, (ads.get(key) ?? 0) + spend)
  }
}

function toSku(aggregate: SalesAggregate, cost: CostRecord, adSpendTotal?: number): Sku | null {
  if (aggregate.units <= 0 || aggregate.grossCents <= 0) return null
  const days = periodDays(aggregate)
  const perUnit = (total: number) => Math.round(total / aggregate.units)
  const provided = [...aggregate.provided]
  if (adSpendTotal !== undefined) provided.push('advertising')
  if (aggregate.channel === 'Amazon') provided.push('vat')
  return {
    id: aggregate.key,
    sourceSku: aggregate.sku,
    channel: aggregate.channel,
    sourceFile: aggregate.sourceFile,
    asin: aggregate.sku,
    title: cost.title || aggregate.title,
    marketplace: aggregate.marketplace,
    category: 'Uncategorised',
    costCents: cost.costCents,
    priceCents: perUnit(aggregate.grossCents),
    priceFloorCents: null,
    referralFeePct: 0,
    fbaFeeCents: Math.max(0, perUnit(aggregate.fulfilmentCents)),
    unitsPerDay: aggregate.units / days,
    unitsSold: aggregate.units,
    periodDays: days,
    returnRatePct: aggregate.refundCents > 0 ? Math.min(100, (aggregate.refundCents / aggregate.grossCents) * 100) : 0,
    discountCents: perUnit(aggregate.discountCents),
    adSpendCents: adSpendTotal === undefined ? undefined : perUnit(adSpendTotal),
    marketplaceFeeCents: Math.max(0, perUnit(aggregate.marketplaceFeesCents)),
    returnCostCents: perUnit(aggregate.refundCents),
    vatCents: aggregate.channel === 'Amazon' ? 0 : undefined,
    providedFields: [...new Set(provided)],
    inventoryUnits: 0,
    buyBoxWon: true,
    repricerActive: false,
  }
}

export function importRawExports(inputs: CsvInput[]): RawImportResult {
  const sources: RawSourceSummary[] = []
  const warnings: string[] = []
  const blockers: string[] = []
  const notices: string[] = []
  const sales = new Map<string, SalesAggregate>()
  const costs = new Map<string, CostRecord>()
  const ads = new Map<string, number>()
  const prepared: Sku[] = []
  let rowsSeen = 0

  for (const input of inputs) {
    const table = parseCsvTable(input.text)
    const kind = detectSourceKind(input.name, input.text)
    rowsSeen += table.rows.length
    let status: RawSourceSummary['status'] = 'ready'
    let message = `${table.rows.length} data row${table.rows.length === 1 ? '' : 's'} recognised`

    if (kind === 'shopify-orders') readShopify(input, sales, warnings)
    else if (kind === 'amazon-settlement') readAmazon(input, sales)
    else if (kind === 'woocommerce-orders') readWooCommerce(input, sales, costs, warnings)
    else if (kind === 'product-costs') readCosts(input, costs)
    else if (kind === 'ad-spend') readAds(input, ads)
    else if (kind === 'marginpulse') {
      const result = parseCsv(input.text, { defaultChannel: 'Store', sourceFile: input.name })
      prepared.push(...result.skus)
      warnings.push(...result.warnings.map((warning) => `${input.name}: ${warning}`))
    } else {
      status = 'error'
      message = 'We could not recognise this export.'
    }

    sources.push({ name: input.name, kind, label: SOURCE_LABEL[kind], status, rows: table.rows.length, message })
  }

  const recognised = sources.filter((source) => source.kind !== 'unknown')
  const hasSalesSource = sources.some((source) =>
    ['shopify-orders', 'amazon-settlement', 'woocommerce-orders', 'marginpulse'].includes(source.kind),
  )
  if (recognised.length === 0) {
    blockers.push('No supported export was recognised. Add Shopify Orders, Amazon Settlement, or WooCommerce Orders.')
  } else if (!hasSalesSource) {
    blockers.push('Add a supported Shopify Orders, Amazon Settlement, or WooCommerce export.')
  } else if (sales.size === 0 && prepared.length === 0) {
    blockers.push('No valid sales rows with a SKU, quantity and price were found in the export.')
  }

  const missingCosts = [...sales.values()].filter((row) => !costs.has(skuKey(row.sku)))
  if (missingCosts.length > 0) {
    blockers.push(`Add a product export with Cost per item / COGS for ${missingCosts.length} SKU(s).`)
  }

  if (!sources.some((source) => source.kind === 'ad-spend')) {
    notices.push('Advertising is not included. Add a SKU-level spend report for a fuller result.')
  }
  if (sources.some((source) => source.kind === 'shopify-orders')) {
    notices.push('Shopify order exports do not include fulfilment, payment-processing or shipping costs.')
  }

  const currenciesUnsupported = warnings.some((warning) => warning.includes('only EUR'))
  if (currenciesUnsupported) blockers.push('Convert or split non-EUR exports before analysis.')

  const skus =
    blockers.length === 0
      ? [
          ...prepared,
          ...[...sales.values()]
            .map((row) => toSku(row, costs.get(skuKey(row.sku))!, ads.get(skuKey(row.sku))))
            .filter((row): row is Sku => row !== null),
        ]
      : []
  const channels = [...new Set(skus.map((row) => row.channel ?? 'Store'))].sort()
  return {
    skus,
    sources,
    readiness: { canAnalyze: skus.length > 0 && blockers.length === 0, blockers, notices },
    warnings,
    rowsSeen,
    channels,
  }
}

export const SHOPIFY_SAMPLE_EXPORTS: CsvInput[] = [
  {
    name: 'shopify-orders.csv',
    text: `Name,Created at,Currency,Lineitem quantity,Lineitem name,Lineitem price,Lineitem SKU,Lineitem discount,Refunded Amount,Shipping Country\n#1001,2026-07-01 10:00:00 +0200,EUR,2,Blue T-shirt,29.90,TS-1,0,0,DE\n#1002,2026-07-02 11:00:00 +0200,EUR,1,Blue T-shirt,29.90,TS-1,2.00,0,DE`,
  },
  {
    name: 'shopify-products.csv',
    text: `Title,SKU,Price,Cost per item\nBlue T-shirt,TS-1,29.90,12.00`,
  },
  {
    name: 'shopify-ad-spend.csv',
    text: `SKU,Ad spend\nTS-1,9.00`,
  },
]
