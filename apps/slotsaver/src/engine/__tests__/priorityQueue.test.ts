import { describe, it, expect } from 'vitest'
import {
  calculateScoreBreakdown,
  rankCandidatesWithBreakdown,
  SCORING_WEIGHTS,
} from '../priorityQueue'
import type { Candidate, Slot } from '../types'

describe('Transparent 4-Factor Priority Queue Scoring Model', () => {
  const dummySlot: Slot = {
    id: 'SLOT-TEST',
    time: '14:00',
    minutes: 840,
    staff: 'Camille',
    service: 'Balayage',
    priceCents: 16800,
    status: 'open',
  }

  it('allocates correct weights totaling exactly 100 points', () => {
    const totalWeight =
      SCORING_WEIGHTS.serviceMatch +
      SCORING_WEIGHTS.availabilityFit +
      SCORING_WEIGHTS.historicalLtv +
      SCORING_WEIGHTS.responseSpeed
    expect(totalWeight).toBe(100)
    expect(SCORING_WEIGHTS.serviceMatch).toBe(40)
    expect(SCORING_WEIGHTS.availabilityFit).toBe(25)
    expect(SCORING_WEIGHTS.historicalLtv).toBe(20)
    expect(SCORING_WEIGHTS.responseSpeed).toBe(15)
  })

  it('awards full 40 points for exact service match and partial for compatible category', () => {
    const exactCandidate: Candidate = {
      id: 'C-1',
      name: 'Amélie L.',
      wantsService: 'Balayage',
      fitScore: 90,
      willTake: true,
      loyalty: 'VIP',
      flexibility: 'High',
    }

    const compatibleCandidate: Candidate = {
      id: 'C-2',
      name: 'Théo R.',
      wantsService: 'Colour & gloss',
      fitScore: 80,
      willTake: true,
      loyalty: 'Regular',
      flexibility: 'Medium',
    }

    const mismatchCandidate: Candidate = {
      id: 'C-3',
      name: 'Bea K.',
      wantsService: 'Blow-dry & style',
      fitScore: 60,
      willTake: false,
      loyalty: 'New',
      flexibility: 'Low',
    }

    const b1 = calculateScoreBreakdown(exactCandidate, dummySlot)
    const b2 = calculateScoreBreakdown(compatibleCandidate, dummySlot)
    const b3 = calculateScoreBreakdown(mismatchCandidate, dummySlot)

    expect(b1.serviceMatch).toBe(40)
    expect(b2.serviceMatch).toBe(26)
    expect(b3.serviceMatch).toBe(10)
  })

  it('awards availability fit points based on flexibility level', () => {
    const highFlex: Candidate = {
      id: 'C-1',
      name: 'High Flex',
      wantsService: 'Balayage',
      fitScore: 85,
      willTake: true,
      loyalty: 'Regular',
      flexibility: 'High',
    }
    const lowFlex: Candidate = {
      id: 'C-2',
      name: 'Low Flex',
      wantsService: 'Balayage',
      fitScore: 85,
      willTake: true,
      loyalty: 'Regular',
      flexibility: 'Low',
    }

    expect(calculateScoreBreakdown(highFlex, dummySlot).availabilityFit).toBe(25)
    expect(calculateScoreBreakdown(lowFlex, dummySlot).availabilityFit).toBe(12)
  })

  it('ranks candidates by total score descending and attaches full breakdown', () => {
    const candidates: Candidate[] = [
      {
        id: 'C-LOW',
        name: 'Low Match',
        wantsService: 'Cut & finish',
        fitScore: 50,
        willTake: false,
        loyalty: 'New',
        flexibility: 'Low',
        historicalLtvCents: 5000,
        avgResponseMinutes: 12.0,
      },
      {
        id: 'C-TOP',
        name: 'Top Match VIP',
        wantsService: 'Balayage',
        fitScore: 98,
        willTake: true,
        loyalty: 'VIP',
        flexibility: 'High',
        historicalLtvCents: 180000,
        avgResponseMinutes: 1.5,
      },
    ]

    const ranked = rankCandidatesWithBreakdown(candidates, dummySlot)
    expect(ranked[0].id).toBe('C-TOP')
    expect(ranked[0].scoreBreakdown?.total).toBe(100)
    expect(ranked[1].id).toBe('C-LOW')
    expect(ranked[1].scoreBreakdown?.total).toBeLessThan(50)
  })
})
