import { useRef, useState, type FormEvent } from 'react'
import { Modal } from './Modal'
import { IconSend, IconCheck } from './icons'
import { submitAuditLead, type LeadFailureReason } from '../lib/leadSubmission'

const ENDPOINT = import.meta.env.VITE_LEAD_ENDPOINT
const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || 'kostinmihail40@gmail.com'

type Status = 'idle' | 'sending' | 'sent' | 'error'

export function LeadForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [store, setStore] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorReason, setErrorReason] = useState<LeadFailureReason | null>(null)
  const sendingRef = useRef(false)

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const mailtoFallback = () => {
    const subject = encodeURIComponent('Profit audit request — MarginPulse')
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\nStore / marketplace: ${store}\n\n${message}`,
    )
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!emailOk || sendingRef.current) return
    const form = e.currentTarget as HTMLFormElement
    const formData = new FormData(form)

    if (!ENDPOINT) {
      mailtoFallback()
      setErrorReason('network')
      setStatus('error')
      return
    }
    sendingRef.current = true
    setStatus('sending')
    setErrorReason(null)
    const result = await submitAuditLead({
      name,
      email,
      store,
      message,
      honey: String(formData.get('_honey') ?? ''),
      pageUrl: window.location.href,
    }, { endpoint: ENDPOINT })
    sendingRef.current = false
    if (result.ok) {
      setStatus('sent')
    } else {
      setErrorReason(result.reason)
      setStatus('error')
    }
  }

  const errorText = errorReason === 'timeout'
    ? 'Sending timed out. Try again or'
    : errorReason === 'rate-limit'
      ? 'Too many requests right now. Wait a minute or'
      : "Couldn't send just now. Try again or"

  if (status === 'sent') {
    return (
      <Modal title="Request received" icon={<IconCheck size={20} />} onClose={onClose}>
        <div className="lead-done">
          <p>Thanks{name ? `, ${name}` : ''} — I'll be in touch within one business day to set up your profit audit.</p>
        </div>
        <div className="modal-foot">
          <button className="btn btn-primary" onClick={onClose}>Done</button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      title="Request a free profit audit"
      subtitle="Want this running on your real Amazon / eBay data? Tell me about your store."
      icon={<IconSend size={18} />}
      onClose={onClose}
    >
      <form onSubmit={submit} noValidate aria-busy={status === 'sending'}>
        <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
          <label htmlFor="audit-website">Website</label>
          <input id="audit-website" name="_honey" type="text" tabIndex={-1} autoComplete="off" />
        </div>
        <label className="field">
          <span className="field-label">Name</span>
          <input className="text-input" type="text" maxLength={100} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        </label>
        <label className="field">
          <span className="field-label">Email <span className="req">*</span></span>
          <input className="text-input" type="email" required maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@store.com" />
        </label>
        <label className="field">
          <span className="field-label">Store / marketplace</span>
          <input className="text-input" type="text" maxLength={200} value={store} onChange={(e) => setStore(e.target.value)} placeholder="Amazon.de · 300 SKUs · home textiles" />
        </label>
        <label className="field">
          <span className="field-label">What's bleeding margin?</span>
          <textarea className="text-input" rows={3} maxLength={2000} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Returns spiking, repricer chasing below cost, FBA fees up…" />
        </label>

        {status === 'error' && (
          <p className="form-error">
            {errorText} <a href={`mailto:${CONTACT_EMAIL}`}>email me directly →</a>
          </p>
        )}

        <p className="modal-note">Sent through FormSubmit. I use your details only to reply — never send passwords or payment data.</p>

        <div className="modal-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={!emailOk || status === 'sending'}>
            {status === 'sending' ? 'Sending…' : 'Request audit'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
