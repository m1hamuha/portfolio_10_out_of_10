export type AuditLeadFields = {
  name: string
  email: string
  store: string
  message: string
  honey: string
  pageUrl: string
}

export type LeadFailureReason = 'timeout' | 'rate-limit' | 'rejected' | 'network'

type PayloadOptions = { id?: string; submittedAt?: string }
type SubmitOptions = {
  endpoint: string
  fetchImpl?: typeof fetch
  timeoutMs?: number
}

function makeId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `margin-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function cleanPage(rawUrl: string) {
  try {
    const url = new URL(rawUrl)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return 'unknown'
    url.search = ''
    url.hash = ''
    return url.toString()
  } catch {
    return 'unknown'
  }
}

export function buildAuditPayload(fields: AuditLeadFields, options: PayloadOptions = {}) {
  return {
    _subject: 'Profit audit request — MarginPulse',
    _template: 'table',
    _honey: fields.honey,
    _replyto: fields.email.trim(),
    name: fields.name.trim(),
    email: fields.email.trim(),
    store: fields.store.trim(),
    message: fields.message.trim(),
    source: 'marginpulse-demo',
    page: cleanPage(fields.pageUrl),
    submission_id: options.id ?? makeId(),
    submitted_at: options.submittedAt ?? new Date().toISOString(),
  }
}

export async function submitAuditLead(
  fields: AuditLeadFields,
  options: SubmitOptions,
): Promise<{ ok: true; filtered: boolean } | { ok: false; reason: LeadFailureReason }> {
  if (fields.honey.trim()) return { ok: true, filtered: true }

  const controller = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, options.timeoutMs ?? 15_000)

  try {
    const response = await (options.fetchImpl ?? fetch)(options.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(buildAuditPayload(fields)),
      signal: controller.signal,
    })
    if (response.status === 429) return { ok: false, reason: 'rate-limit' }
    if (!response.ok) return { ok: false, reason: 'rejected' }
    const body: unknown = await response.json().catch(() => null)
    const accepted = typeof body === 'object' && body !== null && 'success' in body &&
      ((body as { success: unknown }).success === true || (body as { success: unknown }).success === 'true')
    return accepted ? { ok: true, filtered: false } : { ok: false, reason: 'rejected' }
  } catch (error) {
    if (timedOut || (error instanceof DOMException && error.name === 'AbortError')) {
      return { ok: false, reason: 'timeout' }
    }
    return { ok: false, reason: 'network' }
  } finally {
    clearTimeout(timer)
  }
}
