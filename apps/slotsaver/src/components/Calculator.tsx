import { useState } from 'react'
import { formatEur, FILL_RATE_PCT } from '../engine'

// No-show math calculator: avg check × no-shows/week → € lost/mo → € recovered.
// Pure display math on user-chosen inputs; the recovery side uses the engine's
// honest FILL_RATE_PCT so the number stays believable (not a fantasy 100%).
export function Calculator() {
  const [avgEur, setAvgEur] = useState(95) // average check in euros
  const [perWeek, setPerWeek] = useState(6) // no-shows / cancellations per week

  const lostMonthCents = avgEur * 100 * perWeek * 4 // ~4 weeks
  const recoveredMonthCents = Math.round(lostMonthCents * (FILL_RATE_PCT / 100))

  return (
    <div className="calc card">
      <div className="calc-controls">
        <div className="calc-field">
          <div className="calc-field-top">
            <label htmlFor="calc-avg">Average appointment value</label>
            <span className="v num">{formatEur(avgEur * 100, { whole: true })}</span>
          </div>
          <input
            id="calc-avg"
            className="calc-slider"
            type="range"
            min={30}
            max={250}
            step={5}
            value={avgEur}
            onChange={(e) => setAvgEur(Number(e.target.value))}
            aria-valuetext={`${avgEur} euros`}
          />
        </div>

        <div className="calc-field">
          <div className="calc-field-top">
            <label htmlFor="calc-week">No-shows &amp; cancellations / week</label>
            <span className="v num">{perWeek}</span>
          </div>
          <input
            id="calc-week"
            className="calc-slider"
            type="range"
            min={1}
            max={25}
            step={1}
            value={perWeek}
            onChange={(e) => setPerWeek(Number(e.target.value))}
            aria-valuetext={`${perWeek} per week`}
          />
        </div>

        <p className="calc-note">
          Drag the sliders to your numbers. We apply our honest ~{FILL_RATE_PCT}% fill rate — not a
          fantasy 100% — so the recovered figure is what you&apos;d actually see.
        </p>
      </div>

      <div className="calc-result">
        <div className="calc-losing">
          Empty chair time you&apos;re losing
          <span className="big num">{formatEur(lostMonthCents, { whole: true })}/mo</span>
        </div>
        <div className="calc-recovers">
          What SlotSaver would recover
          <span className="big num">{formatEur(recoveredMonthCents, { whole: true })}/mo</span>
        </div>
      </div>
    </div>
  )
}
