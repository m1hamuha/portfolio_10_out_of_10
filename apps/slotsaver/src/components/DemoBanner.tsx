import { IconShield } from './icons'

// Honesty footer: this is sample data; production uses the real booking system
// + a consented (GDPR) waitlist; realistic fill rate, not 100%.
export function DemoBanner() {
  return (
    <footer className="demo-banner" role="note">
      <span className="demo-banner-ico"><IconShield size={15} /></span>
      <p>
        <strong>Demo on sample data.</strong> In production SlotSaver plugs into your booking system
        and a consented waitlist (GDPR-compliant). The fill rate shown is realistic — not 100%.
        Some gaps won&apos;t fill, and that&apos;s honest.
      </p>
    </footer>
  )
}
