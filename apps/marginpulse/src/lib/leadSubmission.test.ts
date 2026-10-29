import { describe, expect, it, vi } from 'vitest'
import { buildAuditPayload, submitAuditLead } from './leadSubmission'
import drawerSource from '../components/LeakDrawer.tsx?raw'
import readmeSource from '../../README.md?raw'
import packageSource from '../../package.json?raw'
import appSource from '../App.tsx?raw'
import storeSource from '../store/useStore.ts?raw'

const fields = {
  name: 'Mila Example',
  email: 'mila@example.com',
  store: 'Amazon.de · 300 SKUs',
  message: 'Returns are spiking',
  honey: '',
  pageUrl: 'https://m1hamuha.github.io/portfolio/marginpulse/?from=portfolio',
}

describe('MarginPulse lead delivery', () => {
  it('builds an identifiable and reply-ready payload', () => {
    expect(buildAuditPayload(fields, {
      id: 'margin-fixed-id',
      submittedAt: '2026-08-16T12:00:00.000Z',
    })).toEqual({
      _subject: 'Profit audit request — MarginPulse',
      _template: 'table',
      _honey: '',
      _replyto: 'mila@example.com',
      name: 'Mila Example',
      email: 'mila@example.com',
      store: 'Amazon.de · 300 SKUs',
      message: 'Returns are spiking',
      source: 'marginpulse-demo',
      page: 'https://m1hamuha.github.io/portfolio/marginpulse/',
      submission_id: 'margin-fixed-id',
      submitted_at: '2026-08-16T12:00:00.000Z',
    })
  })

  it('filters a filled honeypot without making a request', async () => {
    const fetchImpl = vi.fn()
    await expect(submitAuditLead({ ...fields, honey: 'spam' }, {
      endpoint: 'https://example.test/form',
      fetchImpl,
    })).resolves.toEqual({ ok: true, filtered: true })
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('requires explicit acceptance from FormSubmit', async () => {
    const accepted = await submitAuditLead(fields, {
      endpoint: 'https://example.test/form',
      fetchImpl: vi.fn().mockResolvedValue(Response.json({ success: 'true' })),
    })
    expect(accepted).toEqual({ ok: true, filtered: false })

    const ambiguous = await submitAuditLead(fields, {
      endpoint: 'https://example.test/form',
      fetchImpl: vi.fn().mockResolvedValue(Response.json({ message: 'unknown' })),
    })
    expect(ambiguous).toEqual({ ok: false, reason: 'rejected' })
  })

  it('reports rate limits and timeouts separately', async () => {
    await expect(submitAuditLead(fields, {
      endpoint: 'https://example.test/form',
      fetchImpl: vi.fn().mockResolvedValue(Response.json({}, { status: 429 })),
    })).resolves.toEqual({ ok: false, reason: 'rate-limit' })

    await expect(submitAuditLead(fields, {
      endpoint: 'https://example.test/form',
      timeoutMs: 5,
      fetchImpl: vi.fn().mockImplementation((_url, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
          )
        }),
      ),
    })).resolves.toEqual({ ok: false, reason: 'timeout' })
  })
})

describe('demo truthfulness', () => {
  it('labels local catalogue actions and drafts as simulations', () => {
    expect(drawerSource).not.toMatch(/AI-drafted replies|ready to file|File fee dispute|Reclaim Buy Box/)
    expect(drawerSource).toMatch(/Simulate|local draft|Sample reply drafts/)
    expect(readmeSource).not.toMatch(/Amazon SP-API|one-click fixes|AI-drafted/i)
    expect(packageSource).toMatch(/interactive.*demo/i)
    expect(appSource).not.toMatch(/Saved this week|Every profit killer is stopped|What you’ll save|Put .* back in your pocket|\/ week recovered/)
    expect(appSource).toMatch(/Modelled this week|Weekly digest preview|in local model/)
    expect(storeSource).not.toMatch(/Fee dispute filed|removal queued|Buy Box reclaimed|VAT rate corrected/)
    expect(storeSource).toMatch(/Simulated:/)
  })
})
