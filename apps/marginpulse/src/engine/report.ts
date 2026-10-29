import type { Store } from './types'
import { unitEconomics } from './detect'
import { formatEur, pct } from './money'

export interface HealthScore {
  total: number // 0–100
  score: number // alias for total
  rating: 'EXCELLENT' | 'STABLE' | 'AT_RISK' | 'CRITICAL'
  grade: 'Exceptional' | 'Healthy' | 'Needs Attention' | 'Critical Risk'
  breakdown: {
    marginHealth: number // 0–35 pts (net margin % and profitable SKU ratio)
    bleedControl: number // 0–30 pts (leak rate vs total gross revenue)
    costIntegrity: number // 0–20 pts (cost data coverage score)
    feeEfficiency: number // 0–15 pts (returns and fee ratios)
  }
  summary: string
}

export interface BleedingSkuSummary {
  sku: string
  title: string
  channel: string
  marketplace: string
  monthlyGrossEur: string
  monthlyLossEur: string
  marginPct: string
  primaryDriver: string
  remedyAction: string
}

export interface RemediationDirective {
  priority: 'P1 - IMMEDIATE' | 'P2 - HIGH' | 'P3 - MEDIUM'
  title: string
  estimatedMonthlyRecoveryCents: number
  rationale: string
  targetSkus: string[]
}

export interface ExecutiveReportData {
  generatedAtIso: string
  storeName: string
  totalSkus: number
  channels: string[]
  healthScore: HealthScore
  monthlyGrossRevenueCents: number
  monthlyNetProfitCents: number
  monthlyRecoverableBleedCents: number
  annualizedRecoverableBleedCents: number
  netMarginPct: number
  topBleedingSkus: BleedingSkuSummary[]
  directives: RemediationDirective[]
}

export function computePortfolioHealthScore(store: Store, coveragePct = 100): HealthScore {
  let grossMonthly = 0
  let profitMonthly = 0
  let profitableCount = 0

  for (const sku of store.skus) {
    const e = unitEconomics(sku)
    const mUnits = sku.unitsPerDay * 30
    grossMonthly += Math.round(sku.priceCents * mUnits)
    profitMonthly += Math.round(e.contribution * mUnits)
    if (e.contribution > 0) profitableCount++
  }

  const netMargin = grossMonthly > 0 ? (profitMonthly / grossMonthly) * 100 : 0
  const profitableRatio = store.skus.length > 0 ? profitableCount / store.skus.length : 1

  // 1. Margin Health (35 pts max)
  const marginScore = Math.max(0, Math.min(35, Math.round((netMargin / 20) * 20 + profitableRatio * 15)))

  // 2. Bleed Control (30 pts max)
  const activeBleedMonthly = store.leaks
    .filter((l) => l.status === 'active')
    .reduce((sum, l) => sum + l.ratePerDayCents * 30, 0)
  const bleedRatio = grossMonthly > 0 ? activeBleedMonthly / grossMonthly : 0
  const bleedScore = Math.max(0, Math.min(30, Math.round(30 - bleedRatio * 150)))

  // 3. Cost Integrity (20 pts max)
  const integrityScore = Math.round((coveragePct / 100) * 20)

  // 4. Fee Efficiency (15 pts max)
  const avgReturnRate =
    store.skus.length > 0 ? store.skus.reduce((sum, s) => sum + s.returnRatePct, 0) / store.skus.length : 5
  const feeScore = Math.max(0, Math.min(15, Math.round(15 - Math.max(0, avgReturnRate - 5) * 1.5)))

  const total = marginScore + bleedScore + integrityScore + feeScore
  const rating = total >= 80 ? 'EXCELLENT' : total >= 65 ? 'STABLE' : total >= 45 ? 'AT_RISK' : 'CRITICAL'
  const grade: HealthScore['grade'] =
    total >= 80 ? 'Exceptional' : total >= 65 ? 'Healthy' : total >= 45 ? 'Needs Attention' : 'Critical Risk'
  const summary =
    total >= 80
      ? 'Strong financial posture with low fee drag and healthy SKU margins.'
      : total >= 65
      ? 'Acceptable profitability, but identifiable margin leaks require remediation.'
      : 'Critical profit bleed detected: immediate repricing and ad spend caps required.'

  return {
    total,
    score: total,
    rating,
    grade,
    breakdown: {
      marginHealth: marginScore,
      bleedControl: bleedScore,
      costIntegrity: integrityScore,
      feeEfficiency: feeScore,
    },
    summary,
  }
}

export function buildExecutiveReportData(store: Store, storeName = 'Store Catalogue'): ExecutiveReportData {
  let grossMonthly = 0
  let profitMonthly = 0

  const bleedingSkus: { sku: any; monthlyLoss: number; driver: string; remedy: string }[] = []

  for (const sku of store.skus) {
    const e = unitEconomics(sku)
    const mUnits = sku.unitsPerDay * 30
    grossMonthly += Math.round(sku.priceCents * mUnits)
    profitMonthly += Math.round(e.contribution * mUnits)

    if (e.contribution < 0) {
      const loss = Math.abs(Math.round(e.contribution * mUnits))
      let driver = 'Elevated landed COGS'
      let remedy = 'Renegotiate unit manufacturing cost or raise price'

      if (e.ppc > Math.max(0, e.preAdContribution)) {
        driver = 'PPC spend exceeds pre-ad margin'
        remedy = 'Cap advertising budget or pause non-converting keywords'
      } else if (sku.returnRatePct > 15) {
        driver = `Excessive return rate (${sku.returnRatePct.toFixed(1)}%)`
        remedy = 'Audit packaging and product sizing charts'
      } else if (e.shipping + e.fba > sku.priceCents * 0.4) {
        driver = 'Carrier & fulfilment fee squeeze'
        remedy = 'Optimize package dimensions or bundle multi-packs'
      }

      bleedingSkus.push({ sku, monthlyLoss: loss, driver, remedy })
    }
  }

  bleedingSkus.sort((a, b) => b.monthlyLoss - a.monthlyLoss)

  const topBleedingSkus: BleedingSkuSummary[] = bleedingSkus.slice(0, 10).map((b) => {
    const e = unitEconomics(b.sku)
    const mUnits = b.sku.unitsPerDay * 30
    return {
      sku: b.sku.sourceSku ?? b.sku.id,
      title: b.sku.title,
      channel: b.sku.channel ?? 'Store',
      marketplace: b.sku.marketplace,
      monthlyGrossEur: formatEur(Math.round(b.sku.priceCents * mUnits), { cents: false }),
      monthlyLossEur: formatEur(b.monthlyLoss, { cents: false }),
      marginPct: pct(e.marginPct),
      primaryDriver: b.driver,
      remedyAction: b.remedy,
    }
  })

  const totalBleedMonthly = bleedingSkus.reduce((sum, b) => sum + b.monthlyLoss, 0)
  const channels = [...new Set(store.skus.map((s) => s.channel ?? 'Store'))].sort()
  const netMarginPct = grossMonthly > 0 ? (profitMonthly / grossMonthly) * 100 : 0
  const healthScore = computePortfolioHealthScore(store)

  // Directives
  const directives: RemediationDirective[] = []
  if (bleedingSkus.length > 0) {
    const ppcBleeds = bleedingSkus.filter((b) => b.driver.includes('PPC'))
    if (ppcBleeds.length > 0) {
      directives.push({
        priority: 'P1 - IMMEDIATE',
        title: 'Cap Unprofitable Advertising Campaigns',
        estimatedMonthlyRecoveryCents: ppcBleeds.reduce((s, b) => s + b.monthlyLoss, 0),
        rationale: 'Stop ad spend on products where customer acquisition cost exceeds contribution margin.',
        targetSkus: ppcBleeds.map((b) => b.sku.sourceSku),
      })
    }

    const returnBleeds = bleedingSkus.filter((b) => b.driver.includes('return'))
    if (returnBleeds.length > 0) {
      directives.push({
        priority: 'P2 - HIGH',
        title: 'Remediate High-Return Catalogue Lines',
        estimatedMonthlyRecoveryCents: Math.round(returnBleeds.reduce((s, b) => s + b.monthlyLoss, 0) * 0.6),
        rationale: 'Address product defects or inaccurate descriptions causing return rates >15%.',
        targetSkus: returnBleeds.map((b) => b.sku.sourceSku),
      })
    }

    const priceFloorBleeds = bleedingSkus.filter((b) => !b.driver.includes('PPC') && !b.driver.includes('return'))
    if (priceFloorBleeds.length > 0) {
      directives.push({
        priority: 'P3 - MEDIUM',
        title: 'Reprice Underwater SKUs Above Break-Even Floor',
        estimatedMonthlyRecoveryCents: priceFloorBleeds.reduce((s, b) => s + b.monthlyLoss, 0),
        rationale: 'Adjust listing prices upward to cover recent fee and carrier cost inflation.',
        targetSkus: priceFloorBleeds.map((b) => b.sku.sourceSku),
      })
    }
  }

  return {
    generatedAtIso: new Date().toISOString(),
    storeName,
    totalSkus: store.skus.length,
    channels,
    healthScore,
    monthlyGrossRevenueCents: grossMonthly,
    monthlyNetProfitCents: profitMonthly,
    monthlyRecoverableBleedCents: totalBleedMonthly,
    annualizedRecoverableBleedCents: totalBleedMonthly * 12,
    netMarginPct,
    topBleedingSkus,
    directives,
  }
}

/** Generates printable HTML string styled with print CSS for direct browser vector PDF printing */
export function generateExecutiveReportHtml(data: ExecutiveReportData): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>MarginPulse Executive Audit — ${data.storeName}</title>
  <style>
    @page { size: A4; margin: 16mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #111827; background: #fff; margin: 0; padding: 24px; line-height: 1.4; font-size: 13px; }
    .header { border-bottom: 2px solid #111827; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
    .header h1 { font-size: 24px; margin: 0; font-weight: 800; letter-spacing: -0.5px; }
    .header .meta { font-size: 11px; color: #6b7280; text-align: right; }
    .score-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 20px; display: flex; gap: 24px; align-items: center; }
    .score-badge { font-size: 38px; font-weight: 800; color: ${data.healthScore.score >= 70 ? '#059669' : '#dc2626'}; border: 4px solid currentColor; border-radius: 50%; width: 75px; height: 75px; display: flex; align-items: center; justify-content: center; }
    .kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
    .kpi { background: #f3f4f6; padding: 12px; border-radius: 6px; }
    .kpi-label { font-size: 11px; text-transform: uppercase; color: #6b7280; font-weight: 600; }
    .kpi-val { font-size: 18px; font-weight: 700; margin-top: 4px; }
    .kpi-val.red { color: #dc2626; }
    .kpi-val.green { color: #059669; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px; }
    th { background: #f9fafb; border-bottom: 2px solid #e5e7eb; text-align: left; padding: 8px; font-weight: 600; }
    td { border-bottom: 1px solid #f3f4f6; padding: 8px; }
    .directive { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 10px 14px; margin-bottom: 10px; border-radius: 0 4px 4px 0; }
    .directive.p1 { background: #fef2f2; border-left-color: #ef4444; }
    .directive h4 { margin: 0 0 4px 0; font-size: 13px; font-weight: 700; }
    .directive p { margin: 0; font-size: 11px; color: #4b5563; }
    @media print { body { padding: 0; } button { display: none; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>MarginPulse Financial Health Audit</h1>
      <div>Store: <b>${data.storeName}</b> · Channels: <b>${data.channels.join(', ')}</b> · Catalogue: <b>${data.totalSkus} SKUs</b></div>
    </div>
    <div class="meta">
      <div>Report ID: MP-${Date.now().toString(36).toUpperCase()}</div>
      <div>Generated: ${new Date(data.generatedAtIso).toLocaleDateString()}</div>
    </div>
  </div>

  <div class="score-card">
    <div class="score-badge">${data.healthScore.total}</div>
    <div>
      <div style="font-weight: 700; font-size: 16px;">Portfolio Health Status: ${data.healthScore.rating}</div>
      <div style="color: #4b5563; margin-top: 4px;">${data.healthScore.summary}</div>
      <div style="font-size: 11px; color: #6b7280; margin-top: 8px;">
        Margin Health: <b>${data.healthScore.breakdown.marginHealth}/35</b> ·
        Bleed Control: <b>${data.healthScore.breakdown.bleedControl}/30</b> ·
        Cost Integrity: <b>${data.healthScore.breakdown.costIntegrity}/20</b> ·
        Fee Efficiency: <b>${data.healthScore.breakdown.feeEfficiency}/15</b>
      </div>
    </div>
  </div>

  <div class="kpi-row">
    <div class="kpi">
      <div class="kpi-label">Monthly Gross Sales</div>
      <div class="kpi-val">${formatEur(data.monthlyGrossRevenueCents)}</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Net Operating Margin</div>
      <div class="kpi-val ${data.netMarginPct < 8 ? 'red' : 'green'}">${pct(data.netMarginPct)}</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Monthly Profit Bleed</div>
      <div class="kpi-val red">−${formatEur(data.monthlyRecoverableBleedCents)}</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Annualized Recovery ROI</div>
      <div class="kpi-val green">+${formatEur(data.annualizedRecoverableBleedCents)}</div>
    </div>
  </div>

  <h3 style="margin-bottom: 8px;">Top Bleeding SKUs Requiring Remediation</h3>
  <table>
    <thead>
      <tr>
        <th>SKU</th>
        <th>Product Title</th>
        <th>Channel</th>
        <th>Gross (Mo)</th>
        <th>Bleed (Mo)</th>
        <th>Margin %</th>
        <th>Primary Root Cause</th>
      </tr>
    </thead>
    <tbody>
      ${data.topBleedingSkus
        .map(
          (s) => `
        <tr>
          <td><b>${s.sku}</b></td>
          <td>${s.title}</td>
          <td>${s.channel}</td>
          <td>${s.monthlyGrossEur}</td>
          <td style="color: #dc2626; font-weight: 700;">−${s.monthlyLossEur}</td>
          <td style="color: #dc2626;">${s.marginPct}</td>
          <td>${s.primaryDriver}</td>
        </tr>
      `,
        )
        .join('')}
    </tbody>
  </table>

  <h3 style="margin-bottom: 8px;">Prioritized Action Directives</h3>
  ${data.directives
    .map(
      (d) => `
    <div class="directive ${d.priority.includes('P1') ? 'p1' : ''}">
      <h4>${d.priority}: ${d.title} — Expected Recovery: +${formatEur(d.estimatedMonthlyRecoveryCents)}/mo</h4>
      <p>${d.rationale} (Targets: ${d.targetSkus.slice(0, 4).join(', ')}${d.targetSkus.length > 4 ? '…' : ''})</p>
    </div>
  `,
    )
    .join('')}
</body>
</html>`
}
