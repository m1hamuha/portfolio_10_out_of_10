import React from 'react'

type Bar = { label: string; value: number }
export const BarChart: React.FC<{ data: Bar[]; height?: number }> = ({ data, height = 180 }) => {
  const max = Math.max(1, ...data.map(d => d.value))
  const summary = data.length
    ? `Bar chart, ${data.length} ${data.length === 1 ? 'value' : 'values'}: ` +
      data.map(d => `${d.label} ${d.value.toLocaleString('en-US')}`).join(', ')
    : 'Bar chart, no data'
  return (
    <div role="img" aria-label={summary} style={{ display: 'flex', alignItems: 'flex-end', height }}>
      {data.map((d) => {
        const h = (d.value / max) * height
        return (
          <div key={d.label} aria-hidden="true" style={{ flex: 1, margin: '0 6px', textAlign: 'center' }}>
            <div style={{ height: h, background: '#4f8bd8', borderRadius: 4 }} />
            <div style={{ marginTop: 6, fontSize: 12, color: '#cbd8ee' }}>{d.label}</div>
          </div>
        )
      })}
    </div>
  )
}
