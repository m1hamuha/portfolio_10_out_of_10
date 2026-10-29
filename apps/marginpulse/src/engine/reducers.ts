import { DAY_MS } from './generate'
import { FLOOR_MARGIN_PCT, unitEconomics } from './detect'
import type { Action, ActionType, Leak, Store } from './types'

export const primaryAction = (leak: Leak): ActionType => leak.actions[0]

function healthyPriceFloorCents(sku: Store['skus'][number]): number {
  const variableRate =
    sku.referralFeePct / 100 + (sku.returnRatePct / 100) * 0.4 + 0.06 + FLOOR_MARGIN_PCT / 100
  if (variableRate >= 1) return sku.priceCents

  let floor = Math.ceil((sku.costCents + sku.fbaFeeCents) / (1 - variableRate))
  // The economics engine rounds each component to cents, so close any final
  // rounding gap rather than advertising a floor that still misses its target.
  while (floor < 1_000_000_000) {
    const candidate = { ...sku, priceCents: floor }
    if (unitEconomics(candidate).marginPct >= FLOOR_MARGIN_PCT) return floor
    floor += 1
  }
  return sku.priceCents
}

/** Pure reducer: returns a new Store, never mutates the input. */
export function apply(store: Store, action: Action): Store {
  const next: Store = structuredClone(store)

  if (action.type === 'TICK') {
    const dt = action.clockMs - next.clockMs
    if (dt > 0) {
      const rate = next.leaks
        .filter((l) => l.status === 'active')
        .reduce((a, l) => a + l.ratePerDayCents, 0)
      next.accruedLeakTodayCents += Math.round((rate * dt) / DAY_MS)
      next.clockMs = action.clockMs
    }
    return next
  }

  const leak = next.leaks.find((l) => l.id === action.leakId)
  if (!leak || leak.status !== 'active') return next // no-op on unknown/resolved

  // Generic resolution invariant: stop the bleed, bank a week of savings.
  leak.status = 'resolved'
  next.savedThisWeekCents += leak.ratePerDayCents * 7
  next.resolvedCount += 1

  const sku = next.skus.find((k) => k.id === leak.skuId)

  switch (action.type) {
    case 'SET_PRICE_FLOOR':
      if (sku) {
        const floor = healthyPriceFloorCents(sku)
        sku.priceFloorCents = floor
        sku.priceCents = Math.max(sku.priceCents, floor)
        sku.repricerActive = false
      }
      break
    case 'PAUSE_REPRICER':
      if (sku) sku.repricerActive = false
      break
    case 'WIN_BUYBOX':
      if (sku) sku.buyBoxWon = true
      break
    case 'DISPUTE_FEE':
    case 'DISPUTE_STORAGE':
      next.reimbursementsPendingCents += leak.claimCents ?? leak.ratePerDayCents * 30
      break
    case 'RESOLVE_RETURNS':
    case 'CAP_AD_SPEND':
    case 'FIX_VAT':
    case 'CREATE_RESTOCK_ALERT':
      // resolution is the whole effect
      break
  }

  return next
}
