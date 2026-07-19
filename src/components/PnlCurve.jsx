import { useMemo } from 'react'
import { tradePnl } from '../lib/stats'

export default function PnlCurve({ trades, height = 160 }) {
  const points = useMemo(() => {
    const sorted = [...trades]
      .filter((t) => t.trade_date)
      .sort((a, b) => new Date(a.trade_date) - new Date(b.trade_date))
    let cumulative = 0
    return sorted.map((t) => {
      const pnl = tradePnl(t)
      if (pnl !== null) cumulative += pnl
      return cumulative
    })
  }, [trades])

  if (points.length < 2) {
    return <div className="pnl-curve-empty">Not enough data yet</div>
  }

  const width = 600
  const min = Math.min(0, ...points)
  const max = Math.max(0, ...points)
  const range = max - min || 1
  const stepX = width / (points.length - 1)

  const coords = points.map((p, i) => [i * stepX, height - ((p - min) / range) * height])
  const path = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const zeroY = height - ((0 - min) / range) * height
  const last = points[points.length - 1]

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="pnl-curve" preserveAspectRatio="none">
      <line x1="0" y1={zeroY} x2={width} y2={zeroY} className="pnl-curve-zero" />
      <path d={path} className={`pnl-curve-line ${last >= 0 ? 'tone-long' : 'tone-short'}`} fill="none" />
    </svg>
  )
}