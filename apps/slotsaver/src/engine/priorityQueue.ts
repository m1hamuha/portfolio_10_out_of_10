import type { Candidate, ScoreBreakdown, Slot } from './types'

/**
 * 4-Factor Scoring Weights:
 * 1. Service Match: 40 pts max
 * 2. Availability Fit: 25 pts max
 * 3. Historical Loyalty / LTV: 20 pts max
 * 4. Response Speed History: 15 pts max
 * Sum = 100 points maximum.
 */
export const SCORING_WEIGHTS = {
  serviceMatch: 40,
  availabilityFit: 25,
  historicalLtv: 20,
  responseSpeed: 15,
} as const

/** Checks if two services are closely compatible salon categories. */
function isServiceCompatible(a: string, b: string): boolean {
  const normA = a.toLowerCase()
  const normB = b.toLowerCase()
  if (normA === normB) return true

  const isColor = (s: string) => /colour|color|balayage|gloss|retouch|toner/i.test(s)
  const isCutStyle = (s: string) => /cut|blow-dry|style|finish|keratin/i.test(s)

  return (isColor(normA) && isColor(normB)) || (isCutStyle(normA) && isCutStyle(normB))
}

/** Compute the deterministic 4-factor scoring breakdown for a candidate and slot. */
export function calculateScoreBreakdown(candidate: Candidate, slot: Slot): ScoreBreakdown {
  // 1. Service Match (0..40 pts)
  let serviceMatch = 10
  let serviceMatchDetails = 'Alternative service requested'
  if (candidate.wantsService.toLowerCase() === slot.service.toLowerCase()) {
    serviceMatch = 40
    serviceMatchDetails = `Exact match for ${slot.service} (40/40)`
  } else if (isServiceCompatible(candidate.wantsService, slot.service)) {
    serviceMatch = 26
    serviceMatchDetails = `Compatible service category: wants ${candidate.wantsService} (26/40)`
  } else {
    serviceMatchDetails = `Service mismatch: wants ${candidate.wantsService} vs ${slot.service} (10/40)`
  }

  // 2. Availability Fit (0..25 pts)
  let availabilityFit = 12
  let availabilityDetails = 'Low flexibility (12/25)'
  if (candidate.flexibility === 'High') {
    availabilityFit = 25
    availabilityDetails = 'High schedule flexibility (25/25)'
  } else if (candidate.flexibility === 'Medium') {
    availabilityFit = 18
    availabilityDetails = 'Moderate schedule flexibility (18/25)'
  }

  // 3. Historical LTV & Loyalty (0..20 pts)
  let historicalLtv = 8
  let ltvDetails = 'New client baseline (8/20)'
  const ltvCents = candidate.historicalLtvCents ?? (candidate.loyalty === 'VIP' ? 1450_00 : candidate.loyalty === 'Regular' ? 620_00 : 120_00)
  if (candidate.loyalty === 'VIP' || ltvCents >= 1200_00) {
    historicalLtv = 20
    ltvDetails = `VIP client · €${Math.round(ltvCents / 100)} lifetime value (20/20)`
  } else if (candidate.loyalty === 'Regular' || ltvCents >= 400_00) {
    historicalLtv = 14
    ltvDetails = `Regular client · €${Math.round(ltvCents / 100)} lifetime value (14/20)`
  } else {
    ltvDetails = `New client · €${Math.round(ltvCents / 100)} lifetime value (8/20)`
  }

  // 4. Response Speed History (0..15 pts)
  let responseSpeed = 6
  let responseSpeedDetails = 'Moderate historic response time'
  const respMins = candidate.avgResponseMinutes ?? (candidate.fitScore >= 80 ? 1.8 : candidate.fitScore >= 60 ? 4.2 : 8.5)
  if (respMins <= 2.5) {
    responseSpeed = 15
    responseSpeedDetails = `Lightning responder: avg ${respMins.toFixed(1)}m (15/15)`
  } else if (respMins <= 5.0) {
    responseSpeed = 11
    responseSpeedDetails = `Fast responder: avg ${respMins.toFixed(1)}m (11/15)`
  } else if (respMins <= 10.0) {
    responseSpeed = 7
    responseSpeedDetails = `Standard responder: avg ${respMins.toFixed(1)}m (7/15)`
  } else {
    responseSpeed = 3
    responseSpeedDetails = `Slow responder: avg ${respMins.toFixed(1)}m (3/15)`
  }

  const total = Math.min(100, Math.max(0, serviceMatch + availabilityFit + historicalLtv + responseSpeed))

  return {
    serviceMatch,
    availabilityFit,
    historicalLtv,
    responseSpeed,
    total,
    serviceMatchDetails,
    availabilityDetails,
    ltvDetails,
    responseSpeedDetails,
  }
}

/**
 * Rank candidates using the transparent 4-factor scoring model.
 * Enriches each candidate with their detailed ScoreBreakdown.
 */
export function rankCandidatesWithBreakdown(waitlist: Candidate[], slot: Slot): Candidate[] {
  return waitlist
    .map((candidate, originalIndex) => {
      const breakdown = calculateScoreBreakdown(candidate, slot)
      return {
        candidate: {
          ...candidate,
          scoreBreakdown: breakdown,
        },
        score: breakdown.total,
        originalIndex,
      }
    })
    .sort((a, b) => b.score - a.score || b.candidate.fitScore - a.candidate.fitScore || a.originalIndex - b.originalIndex)
    .map(({ candidate }) => candidate)
}
