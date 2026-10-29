import { useState, useMemo } from 'react'
import { formatEur } from '../engine/money'
import { calculateRoiMetrics } from '../engine/roi'
import { IconClock, IconEuro, IconShield, IconBolt } from './icons'

export interface RoiCalculatorProps {
  initialMonthlyVolume?: number
  initialHourlyWageEur?: number
}

// Invariant: All financial results computed in integer cents
export function RoiCalculator({
  initialMonthlyVolume = 250,
  initialHourlyWageEur = 45,
}: RoiCalculatorProps) {
  const [monthlyVolume, setMonthlyVolume] = useState(initialMonthlyVolume)
  const [hourlyWageEur, setHourlyWageEur] = useState(initialHourlyWageEur)

  const metrics = useMemo(
    () => calculateRoiMetrics({ monthlyVolume, hourlyWageEur }),
    [monthlyVolume, hourlyWageEur],
  )

  return (
    <div className="roi-calculator-shell" aria-label="Interactive AP ROI Calculator">
      <div className="roi-head">
        <span className="overline">
          <IconBolt size={14} /> ROI & Business Impact Engine
        </span>
        <h3 className="roi-title">Quantifiable ROI for Your Accounting Department</h3>
        <p className="roi-sub">
          Adjust your monthly invoice volume and blended bookkeeping wage to see exact annual cost and time savings.
        </p>
      </div>

      {/* Sliders */}
      <div className="roi-controls-grid">
        <div className="roi-slider-group">
          <div className="roi-slider-label">
            <span>Monthly Supplier Invoices</span>
            <b className="num">{monthlyVolume} docs/mo</b>
          </div>
          <input
            type="range"
            min={50}
            max={2500}
            step={25}
            value={monthlyVolume}
            onChange={(e) => setMonthlyVolume(Number(e.target.value))}
            className="roi-slider"
          />
          <span className="roi-slider-range">50 — 2,500 docs</span>
        </div>

        <div className="roi-slider-group">
          <div className="roi-slider-label">
            <span>Bookkeeper Hourly Wage</span>
            <b className="num">€{hourlyWageEur}/hr</b>
          </div>
          <input
            type="range"
            min={25}
            max={85}
            step={5}
            value={hourlyWageEur}
            onChange={(e) => setHourlyWageEur(Number(e.target.value))}
            className="roi-slider"
          />
          <span className="roi-slider-range">€25 — €85/hour</span>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="roi-kpi-cards">
        <div className="roi-kpi-card green-highlight">
          <div className="roi-kpi-icon">
            <IconEuro size={20} />
          </div>
          <div className="roi-kpi-body">
            <span className="roi-kpi-caption">Net Annual Savings</span>
            <span className="roi-kpi-value num">
              {formatEur(metrics.netAnnualBenefitCents, { whole: true })}
            </span>
            <span className="roi-kpi-sub">after software costs</span>
          </div>
        </div>

        <div className="roi-kpi-card">
          <div className="roi-kpi-icon">
            <IconClock size={20} />
          </div>
          <div className="roi-kpi-body">
            <span className="roi-kpi-caption">Time Saved / Year</span>
            <span className="roi-kpi-value num">{metrics.annualSavedHours} hrs</span>
            <span className="roi-kpi-sub">{metrics.speedupPct}% faster per doc</span>
          </div>
        </div>

        <div className="roi-kpi-card">
          <div className="roi-kpi-icon">
            <IconShield size={20} />
          </div>
          <div className="roi-kpi-body">
            <span className="roi-kpi-caption">Errors Prevented</span>
            <span className="roi-kpi-value num">{metrics.annualErrorsPrevented}</span>
            <span className="roi-kpi-sub">saves {formatEur(metrics.annualErrorSavingsCents, { whole: true })}</span>
          </div>
        </div>

        <div className="roi-kpi-card">
          <div className="roi-kpi-icon">
            <IconBolt size={20} />
          </div>
          <div className="roi-kpi-body">
            <span className="roi-kpi-caption">Payback Period</span>
            <span className="roi-kpi-value num">{metrics.paybackDays} days</span>
            <span className="roi-kpi-sub">instant breakeven</span>
          </div>
        </div>
      </div>

      {/* Visual Comparison Bar */}
      <div className="roi-comparison-wrap">
        <div className="roi-bar-row">
          <span className="roi-bar-tag">Manual Keying:</span>
          <div className="roi-bar-track">
            <div className="roi-bar-fill manual" style={{ width: '100%' }}>
              <span>7 min / doc · High error risk</span>
            </div>
          </div>
        </div>
        <div className="roi-bar-row">
          <span className="roi-bar-tag">Autopilot:</span>
          <div className="roi-bar-track">
            <div className="roi-bar-fill auto" style={{ width: '2.14%' }}>
              <span>9 sec</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
