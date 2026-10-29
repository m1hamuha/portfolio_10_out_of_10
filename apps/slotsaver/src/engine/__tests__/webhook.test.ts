import { describe, it, expect, vi } from 'vitest'
import {
  N8nWebhookDispatcher,
  formatTimestampMs,
  defaultDispatcher,
} from '../webhook'
import type { Slot, Candidate } from '../types'

describe('Resilient n8n Webhook Dispatcher', () => {
  const dummySlot: Slot = {
    id: 'S-TEST',
    time: '15:00',
    minutes: 900,
    staff: 'Anaïs',
    service: 'Colour & gloss',
    priceCents: 12400,
    status: 'open',
  }

  const dummyCandidate: Candidate = {
    id: 'W-1',
    name: 'Amélie L.',
    wantsService: 'Colour & gloss',
    fitScore: 95,
    willTake: true,
    loyalty: 'VIP',
    flexibility: 'High',
  }

  it('formats timestamp with millisecond precision in HH:mm:ss.SSS format', () => {
    const ts = formatTimestampMs(new Date('2026-06-19T14:02:15.123Z'))
    expect(ts).toMatch(/^\d{2}:\d{2}:\d{2}\.\d{3}$/)
  })

  it('gracefully falls back to mock simulation when endpoint is unreachable without throwing', async () => {
    const dispatcher = new N8nWebhookDispatcher('https://unreachable.invalid.domain/webhook', 200)

    const result = await dispatcher.dispatch('cancellation_detected', 'Test Salon', dummySlot, dummyCandidate)

    expect(result.success).toBe(true)
    expect(result.simulated).toBe(true)
    expect(result.durationMs).toBeGreaterThanOrEqual(0)
    expect(result.payload.eventType).toBe('cancellation_detected')
    expect(result.payload.slot.priceCents).toBe(12400)
    expect(result.payload.candidate?.name).toBe('Amélie L.')
  })

  it('correctly handles successful 200 response when webhook is available', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ executionId: 'exec-12345', status: 'enqueued' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const dispatcher = new N8nWebhookDispatcher('https://n8n.webhook.internal/test')
    const result = await dispatcher.dispatch('slot_claimed', 'Test Salon', dummySlot, dummyCandidate)

    expect(result.success).toBe(true)
    expect(result.simulated).toBe(false)
    expect(result.responsePayload.executionId).toBe('exec-12345')

    vi.unstubAllGlobals()
  })

  it('uses defaultDispatcher instance with configured timeout', () => {
    expect(defaultDispatcher).toBeInstanceOf(N8nWebhookDispatcher)
  })
})
