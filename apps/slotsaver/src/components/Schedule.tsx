import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store/useStore'
import { formatEur, type Slot } from '../engine'
import { STAFF } from '../engine'
import { IconCalendar, IconScissors, IconClock } from './icons'

// The day's grid. Columns = stylists, rows = appointments down the day.
// Each slot is a card colour-coded by status (booked / open / filling / saved / lost).

const STATUS_LABEL: Record<Slot['status'], string> = {
  booked: 'Booked',
  open: 'Open',
  filling: 'Filling…',
  saved: 'Saved',
  lost: 'Lost',
}

function SlotCard({ slot }: { slot: Slot }) {
  const phase = useStore((s) => s.phase)
  const demoSlotId = useStore((s) => s.demoSlotId)
  const selectSlot = useStore((s) => s.selectSlot)
  const reducedMotion = useStore((s) => s.reducedMotion)
  const isDemo = slot.id === demoSlotId

  // While the cascade runs, the freed demo slot reads as "filling".
  const liveStatus: Slot['status'] =
    isDemo && (phase === 'opening' || phase === 'ranking' || phase === 'offering' || phase === 'expired')
      ? 'filling'
      : slot.status

  const selectable = slot.status === 'booked' && phase === 'idle'
  // Honour reduced motion: don't loop the attention pulse.
  const pulsing = liveStatus === 'filling' && !reducedMotion

  return (
    <motion.button
      type="button"
      className={`slot slot-${liveStatus} ${isDemo ? 'slot-demo' : ''}`}
      aria-label={`${slot.time} ${slot.service}, ${formatEur(slot.priceCents)}, ${STATUS_LABEL[liveStatus]}`}
      onClick={() => selectable && selectSlot(slot.id)}
      disabled={!selectable}
      layout
      animate={
        pulsing
          ? { boxShadow: ['0 0 0 0 hsl(var(--signal) / 0)', '0 0 0 6px hsl(var(--signal) / 0.16)', '0 0 0 0 hsl(var(--signal) / 0)'] }
          : {}
      }
      transition={{ duration: 1.6, repeat: pulsing ? Infinity : 0, ease: 'easeInOut' }}
    >
      <div className="slot-top">
        <span className="slot-time">{slot.time}</span>
        <span className={`slot-pill slot-pill-${liveStatus}`}>{STATUS_LABEL[liveStatus]}</span>
      </div>
      <div className="slot-service">{slot.service}</div>
      <div className="slot-bottom">
        <span className="slot-client">
          {liveStatus === 'open' ? 'Available' : liveStatus === 'filling' ? 'Refilling…' : slot.clientName ?? '—'}
        </span>
        <span className="slot-price num">{formatEur(slot.priceCents)}</span>
      </div>
    </motion.button>
  )
}

export function Schedule() {
  const slots = useStore((s) => s.store.slots)
  const salonName = useStore((s) => s.store.salonName)
  // Memoised so the per-column filter+sort doesn't rerun on every countdown tick.
  const byStaff = useMemo(
    () =>
      STAFF.map((staff) => ({
        staff,
        slots: slots.filter((s) => s.staff === staff).sort((a, b) => a.minutes - b.minutes),
      })),
    [slots],
  )

  return (
    <section className="schedule card" aria-label="Today's schedule">
      <header className="schedule-head">
        <div className="schedule-title">
          <span className="schedule-ico"><IconCalendar size={18} /></span>
          <div>
            <h2>Today at {salonName}</h2>
            <p className="schedule-sub"><IconClock size={12} /> Thursday · 19 June · 3 chairs</p>
          </div>
        </div>
        <div className="schedule-legend">
          <span className="lg lg-booked">Booked</span>
          <span className="lg lg-open">Open</span>
          <span className="lg lg-saved">Saved</span>
        </div>
      </header>

      <div className="grid-staff">
        {byStaff.map(({ staff, slots }) => (
          <div className="staff-col" key={staff}>
            <div className="staff-head">
              <span className="staff-avatar"><IconScissors size={13} /></span>
              <span className="staff-name">{staff}</span>
            </div>
            <div className="staff-slots">
              {slots.map((slot) => (
                <SlotCard slot={slot} key={slot.id} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
