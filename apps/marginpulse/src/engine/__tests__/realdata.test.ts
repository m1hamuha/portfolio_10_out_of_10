import { describe, it, expect } from 'vitest'
import {
  parseCsv,
  parseMoneyEuros,
  buildStoreFromSkus,
  detectLeaks,
  unitEconomics,
  recompute,
  apply,
  activeLeaks,
  primaryAction,
  waterfallFor,
  leaksReportCsv,
  SAMPLE_CSV,
  TEMPLATE_CSV,
  MAX_CSV_TEXT_CHARS,
  MAX_CSV_DATA_ROWS,
  DAY_MS,
} from '../index'
import type { Sku } from '../types'

const NOON = 12 * 60 * 60 * 1000

function sku(partial: Partial<Sku>): Sku {
  return {
    id: 'SKU-001', asin: 'B0TEST', title: 'Test', marketplace: 'DE', category: 'Test',
    costCents: 500, priceCents: 1500, priceFloorCents: null, referralFeePct: 15,
    fbaFeeCents: 250, unitsPerDay: 5, returnRatePct: 3, inventoryUnits: 10,
    buyBoxWon: true, repricerActive: false, ...partial,
  }
}

describe('parseMoneyEuros', () => {
  it('reads plain, symbol, and grouped formats into integer cents', () => {
    expect(parseMoneyEuros('39.90')).toBe(3990)
    expect(parseMoneyEuros('€39.90')).toBe(3990)
    expect(parseMoneyEuros('9,50')).toBe(950) // comma decimal
    expect(parseMoneyEuros('1.234,56')).toBe(123456) // EU grouping
    expect(parseMoneyEuros('1,234.56')).toBe(123456) // US/UK grouping
    expect(parseMoneyEuros('1.234')).toBe(123400) // EU grouping without cents
    expect(parseMoneyEuros('1,234')).toBe(123400) // US/UK grouping without cents
    expect(parseMoneyEuros('  12 ')).toBe(1200)
    expect(parseMoneyEuros('')).toBeNull()
    expect(parseMoneyEuros('abc')).toBeNull()
    expect(parseMoneyEuros('1e300')).toBeNull()
    expect(parseMoneyEuros('9007199254740991')).toBeNull()
  })
})

describe('CSV parsing', () => {
  it('parses the bundled sample to 16 clean SKUs with no warnings', () => {
    const r = parseCsv(SAMPLE_CSV)
    expect(r.skus).toHaveLength(16)
    expect(r.warnings).toHaveLength(0)
    expect(r.skus.every((k) => Number.isInteger(k.costCents) && Number.isInteger(k.priceCents))).toBe(true)
    expect(r.skus[0].priceCents).toBe(2990) // 29.90 -> cents
  })

  it('parses the downloadable template too', () => {
    const r = parseCsv(TEMPLATE_CSV)
    expect(r.skus.length).toBeGreaterThanOrEqual(2)
  })

  it('tolerates alternate header names and euro money', () => {
    const csv = [
      'Seller SKU,Product Name,Cost Price,Selling Price,Daily Units,Returns %,Stock',
      'A1,Widget,8.50,19.99,4,12,30',
    ].join('\n')
    const r = parseCsv(csv)
    expect(r.skus).toHaveLength(1)
    const k = r.skus[0]
    expect(k.id).toBe('A1')
    expect(k.costCents).toBe(850)
    expect(k.priceCents).toBe(1999)
    expect(k.unitsPerDay).toBe(4)
    expect(k.returnRatePct).toBe(12)
    expect(k.inventoryUnits).toBe(30)
  })

  it('imports an explicitly zero-cost SKU without treating the row as missing data', () => {
    const r = parseCsv([
      'sku,title,cost,price,units_per_day',
      'FREE-SAMPLE,Sample insert,0,4.99,2',
    ].join('\n'))
    expect(r.skus).toHaveLength(1)
    expect(r.skus[0].costCents).toBe(0)
    expect(r.warnings).toHaveLength(0)
  })

  it('reads grouped inventory counts without shrinking them', () => {
    const csv = [
      'sku,cost,price,units_per_day,inventory',
      'EU,8.50,19.99,1.234,1.234',
      'US,8.50,19.99,1.234,"1,234"',
    ].join('\n')
    const r = parseCsv(csv)
    expect(r.skus).toHaveLength(2)
    expect(r.skus[0].unitsPerDay).toBe(1.234)
    expect(r.skus[0].inventoryUnits).toBe(1234)
    expect(r.skus[1].inventoryUnits).toBe(1234)
  })

  it('preserves fractional daily sales for slow-moving SKUs', () => {
    const r = parseCsv([
      'sku,cost,price,units_per_day,inventory',
      'SLOW,5.00,10.00,0.4,10',
    ].join('\n'))
    expect(r.skus).toHaveLength(1)
    expect(r.skus[0].unitsPerDay).toBe(0.4)
    const store = buildStoreFromSkus(r.skus, DAY_MS, 'Slow movers')
    expect(recompute(store).kpis.revenueTodayCents).toBe(400)
  })

  it('keeps comma decimals intact in semicolon-delimited European exports', () => {
    const csv = [
      'sku;title;cost;price',
      'A1;Widget;8,50;19,99',
    ].join('\n')
    const r = parseCsv(csv)
    expect(r.skus).toHaveLength(1)
    expect(r.skus[0].costCents).toBe(850)
    expect(r.skus[0].priceCents).toBe(1999)
  })

  it('keeps quoted multiline fields inside one CSV record', () => {
    const r = parseCsv([
      'sku,title,cost,price',
      'A1,"Widget with\ncare instructions",8.50,19.99',
    ].join('\n'))
    expect(r.rowsSeen).toBe(1)
    expect(r.skus).toHaveLength(1)
    expect(r.skus[0].title).toBe('Widget with\ncare instructions')
    expect(r.warnings).toHaveLength(0)
  })

  it('rejects an unclosed quoted field instead of silently merging later rows', () => {
    const r = parseCsv([
      'sku,title,cost,price',
      'A1,"Broken title,8.50,19.99',
      'A2,Valid product,5.00,12.00',
    ].join('\n'))
    expect(r.skus).toHaveLength(0)
    expect(r.warnings[0]).toMatch(/unclosed.*quote/i)
  })

  it('rejects oversized text and excessive row counts before analysis', () => {
    const hugeText = `sku,cost,price\n${'x'.repeat(MAX_CSV_TEXT_CHARS + 1)}`
    expect(parseCsv(hugeText).warnings[0]).toMatch(/too large/i)

    const tooManyRows = [
      'sku,cost,price',
      ...Array.from({ length: MAX_CSV_DATA_ROWS + 1 }, (_, i) => `S${i},5,12`),
    ].join('\n')
    expect(parseCsv(tooManyRows).warnings[0]).toMatch(/too many rows/i)
  })

  it('skips duplicate SKU ids so actions cannot mutate the wrong row', () => {
    const r = parseCsv([
      'sku,title,cost,price',
      'A1,First,8.50,19.99',
      'A1,Duplicate,5.00,12.00',
    ].join('\n'))
    expect(r.skus).toHaveLength(1)
    expect(r.skus[0].title).toBe('First')
    expect(r.warnings.some((w) => /duplicate SKU.*Row 3|Row 3.*duplicate SKU/i.test(w))).toBe(true)
  })

  it('rejects unsafe numeric values instead of overflowing the model', () => {
    const r = parseCsv([
      'sku,cost,price,units_per_day,return_rate_pct',
      'HUGE,5,1e300,4,2',
      'PCT,5,12,4,1000000000',
      'COMBO,1000000000,1000000000,1000000,2',
    ].join('\n'))
    expect(r.skus).toHaveLength(1)
    expect(r.skus[0].returnRatePct).toBe(0)
    expect(r.warnings.some((w) => /HUGE|Row 2/.test(w))).toBe(true)
    expect(r.warnings.some((w) => /COMBO|Row 4|too large/i.test(w))).toBe(true)
  })

  it('skips rows missing price/cost and reports a warning', () => {
    const csv = ['sku,cost,price', 'OK,5,12', 'BAD,5,'].join('\n')
    const r = parseCsv(csv)
    expect(r.skus).toHaveLength(1)
    expect(r.warnings.some((w) => w.includes('Row 3'))).toBe(true)
    expect(r.rowsSeen).toBe(2)
  })

  it('errors clearly when required columns are absent', () => {
    const r = parseCsv(['name,colour', 'x,red'].join('\n'))
    expect(r.skus).toHaveLength(0)
    expect(r.warnings[0]).toMatch(/price.*cost|cost.*price/i)
  })
})

describe('unitEconomics', () => {
  it('returns integer cents and a margin% whose sign matches contribution', () => {
    const e = unitEconomics(sku({ priceCents: 1000, costCents: 900 }))
    expect(Number.isInteger(e.contribution)).toBe(true)
    expect(e.contribution < 0).toBe(e.marginPct < 0)
  })
})

describe('detectLeaks — derived from real economics', () => {
  it('flags BELOW_FLOOR only when net margin is under the floor', () => {
    const underwater = sku({ id: 'U', priceCents: 1000, costCents: 900, fbaFeeCents: 100, unitsPerDay: 5 })
    const healthy = sku({ id: 'H', priceCents: 4000, costCents: 800, fbaFeeCents: 250, unitsPerDay: 5, returnRatePct: 2 })
    expect(detectLeaks([underwater], NOON).some((l) => l.type === 'BELOW_FLOOR')).toBe(true)
    expect(detectLeaks([healthy], NOON).some((l) => l.type === 'BELOW_FLOOR')).toBe(false)
  })

  it('flags a material below-floor loss on a slow-moving SKU', () => {
    const slowLoss = sku({
      id: 'SLOW-LOSS', priceCents: 2000, costCents: 3000,
      fbaFeeCents: 100, unitsPerDay: 0.4,
    })
    const leak = detectLeaks([slowLoss], NOON).find((l) => l.type === 'BELOW_FLOOR')
    expect(leak).toBeDefined()
    expect(leak!.ratePerDayCents).toBeGreaterThanOrEqual(100)
  })

  it('flags RETURN_SPIKE when returns exceed the threshold, in isolation', () => {
    const s = sku({
      priceCents: 2000,
      costCents: 500,
      fbaFeeCents: 200,
      returnRatePct: 15,
      returnCostCents: 400,
      providedFields: ['refunds'],
      unitsPerDay: 5,
      inventoryUnits: 0,
    })
    const leaks = detectLeaks([s], NOON)
    expect(leaks).toHaveLength(1)
    expect(leaks[0].type).toBe('RETURN_SPIKE')
    expect(leaks[0].ratePerDayCents).toBeGreaterThan(0)
  })

  it('flags a material return spike on a slow-moving high-value SKU', () => {
    const slowHighValue = sku({
      id: 'SLOW-RETURN', priceCents: 100_000, costCents: 10_000,
      referralFeePct: 0, fbaFeeCents: 0, returnRatePct: 25,
      unitsPerDay: 0.5, inventoryUnits: 0,
    })
    const leak = detectLeaks([slowHighValue], NOON).find((l) => l.type === 'RETURN_SPIKE')
    expect(leak).toBeDefined()
    expect(leak!.ratePerDayCents).toBeGreaterThanOrEqual(100)
  })

  it('flags material excessive fees on a slow-moving high-value SKU', () => {
    const slowHighFee = sku({
      id: 'SLOW-FEE', priceCents: 100_000, costCents: 10_000,
      referralFeePct: 0, fbaFeeCents: 50_000, unitsPerDay: 0.5,
      inventoryUnits: 0,
    })
    const leak = detectLeaks([slowHighFee], NOON).find((l) => l.type === 'FEE_HIKE')
    expect(leak).toBeDefined()
    expect(leak!.ratePerDayCents).toBeGreaterThanOrEqual(100)
  })

  it('flags BUYBOX_LOST only on a profitable mover', () => {
    const lostButProfitable = sku({ buyBoxWon: false, priceCents: 4000, costCents: 800, fbaFeeCents: 250, unitsPerDay: 6, returnRatePct: 2 })
    const lostButLosing = sku({ buyBoxWon: false, priceCents: 1000, costCents: 950, fbaFeeCents: 100, unitsPerDay: 6 })
    expect(detectLeaks([lostButProfitable], NOON).some((l) => l.type === 'BUYBOX_LOST')).toBe(true)
    expect(detectLeaks([lostButLosing], NOON).some((l) => l.type === 'BUYBOX_LOST')).toBe(false)
  })

  it('flags a material lost Buy Box on a slow-moving high-value SKU', () => {
    const slowHighValue = sku({
      id: 'SLOW-BUYBOX', priceCents: 100_000, costCents: 10_000,
      referralFeePct: 0, fbaFeeCents: 0, returnRatePct: 0,
      unitsPerDay: 0.5, inventoryUnits: 0, buyBoxWon: false,
    })
    const leak = detectLeaks([slowHighValue], NOON).find((l) => l.type === 'BUYBOX_LOST')
    expect(leak).toBeDefined()
    expect(leak!.ratePerDayCents).toBeGreaterThanOrEqual(100)
  })

  it('every detected leak has positive integer cents, a real SKU and actions; sorted worst-first', () => {
    const { skus } = parseCsv(SAMPLE_CSV)
    const leaks = detectLeaks(skus, NOON)
    const ids = new Set(skus.map((k) => k.id))
    expect(leaks.length).toBeGreaterThanOrEqual(6)
    for (const l of leaks) {
      expect(Number.isInteger(l.ratePerDayCents)).toBe(true)
      expect(l.ratePerDayCents).toBeGreaterThan(0)
      expect(ids.has(l.skuId)).toBe(true)
      expect(l.actions.length).toBeGreaterThan(0)
    }
    const rates = leaks.map((l) => l.ratePerDayCents)
    expect([...rates].sort((a, b) => b - a)).toEqual(rates)
    expect(new Set(leaks.map((l) => l.type)).size).toBeGreaterThanOrEqual(3)
  })

  it('is deterministic (no Date.now / Math.random)', () => {
    const { skus } = parseCsv(SAMPLE_CSV)
    expect(detectLeaks(skus, NOON)).toEqual(detectLeaks(skus, NOON))
  })
})

describe('buildStoreFromSkus — the imported store runs the same engine', () => {
  it('does not subtract detected leaks twice from current net profit', () => {
    const current = sku({
      priceCents: 1000,
      costCents: 900,
      adSpendCents: 60,
      referralFeePct: 0,
      fbaFeeCents: 0,
      returnRatePct: 0,
      unitsPerDay: 5,
      inventoryUnits: 0,
    })
    const store = buildStoreFromSkus([current], DAY_MS, 'Current economics')
    expect(activeLeaks(store).some((leak) => leak.type === 'BELOW_FLOOR')).toBe(true)
    expect(recompute(store).kpis.netProfitTodayCents).toBe(200)
    expect(waterfallFor(store, current.id).at(-1)?.cumulativeCents).toBe(6000)
  })

  it('builds a store the dashboard can recompute, with consistent leak totals', () => {
    const { skus } = parseCsv(SAMPLE_CSV)
    const store = buildStoreFromSkus(skus, NOON, 'Acme')
    expect(store.skuCount).toBe(16)
    const { kpis } = recompute(store)
    const sum = activeLeaks(store).reduce((a, l) => a + l.ratePerDayCents, 0)
    expect(kpis.totalLeakRatePerDayCents).toBe(sum)
    expect(kpis.monthlyLeakProjectionCents).toBe(sum * 30)
  })

  it('resolving an imported leak banks savings and the waterfall still balances', () => {
    const { skus } = parseCsv(SAMPLE_CSV)
    const store = buildStoreFromSkus(skus, NOON, 'Acme')
    const leak = activeLeaks(store)[0]
    const before = recompute(store).kpis

    const next = apply(store, { type: primaryAction(leak), leakId: leak.id })
    const after = recompute(next).kpis
    expect(after.totalLeakRatePerDayCents).toBe(before.totalLeakRatePerDayCents - leak.ratePerDayCents)
    expect(after.savedThisWeekCents).toBe(leak.ratePerDayCents * 7)

    const bars = waterfallFor(store, leak.skuId)
    const end = bars[bars.length - 1]
    const steps = bars.slice(0, -1).reduce((a, b) => a + b.deltaCents, 0)
    expect(steps).toBe(end.cumulativeCents)
  })

  it('sets a price floor that reaches the stated 8% margin after variable costs', () => {
    const current = sku({
      priceCents: 1000,
      costCents: 700,
      referralFeePct: 15,
      fbaFeeCents: 100,
      returnRatePct: 5,
      unitsPerDay: 5,
    })
    const store = buildStoreFromSkus([current], NOON, 'Price floor')
    const leak = activeLeaks(store).find((item) => item.type === 'BELOW_FLOOR')
    expect(leak).toBeDefined()
    const next = apply(store, { type: 'SET_PRICE_FLOOR', leakId: leak!.id })
    expect(unitEconomics(next.skus[0]).marginPct).toBeGreaterThanOrEqual(8)
  })

  it('is reproducible for the same catalogue + name', () => {
    const { skus } = parseCsv(SAMPLE_CSV)
    expect(buildStoreFromSkus(skus, NOON, 'Acme')).toEqual(buildStoreFromSkus(skus, NOON, 'Acme'))
  })
})

describe('leaksReportCsv export', () => {
  it('exports a header + one row per active leak with 2dp euro amounts', () => {
    const { skus } = parseCsv(SAMPLE_CSV)
    const store = buildStoreFromSkus(skus, NOON, 'Acme')
    const lines = leaksReportCsv(store).split('\n')
    expect(lines[0]).toContain('SKU')
    expect(lines[0]).toContain('EUR_per_day')
    expect(lines.length - 1).toBe(activeLeaks(store).length)
    const cells = lines[1].split(',')
    expect(cells).toHaveLength(10)
    expect(cells[6]).toMatch(/^\d+\.\d{2}$/) // EUR/day, 2 decimals
    expect(cells[7]).toMatch(/^\d+\.\d{2}$/) // EUR/month, 2 decimals
  })
})
