import { useMemo, useState } from 'react'
import StatsBlock from '../components/StatsBlock'
import PnlCurve from '../components/PnlCurve'
import { computeStats, groupByMonth, monthLabel } from '../lib/stats'

const FULL_FIELDS = [
  'totalTrades', 'wins', 'losses', 'totalR', 'avgWin', 'avgLoss',
  'pnl', 'profitFactor', 'holdTime', 'avgWinHoldTime', 'avgLossHoldTime',
]

export default function StatsPage({ trades }) {
  const monthGroups = useMemo(() => groupByMonth(trades), [trades])
  const monthKeys = useMemo(
    () => Object.keys(monthGroups).filter((k) => k !== 'unknown').sort().reverse(),
    [monthGroups]
  )
  const [selectedMonth, setSelectedMonth] = useState('')

  const overallStats = useMemo(() => computeStats(trades), [trades])
  const monthTrades = selectedMonth ? monthGroups[selectedMonth] || [] : []
  const monthStats = useMemo(() => computeStats(monthTrades), [monthTrades])

  return (
    <div className="stats-page">
      <section className="stats-section">
        <h2>Overall</h2>
        <StatsBlock stats={overallStats} fields={FULL_FIELDS} />
        <PnlCurve trades={trades} />
      </section>

      <section className="stats-section">
        <div className="stats-section-header">
          <h2>By month</h2>
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
            <option value="">Select a month</option>
            {monthKeys.map((k) => (
              <option key={k} value={k}>{monthLabel(k)}</option>
            ))}
          </select>
        </div>
        {selectedMonth ? (
          <>
            <StatsBlock stats={monthStats} fields={FULL_FIELDS} />
            <PnlCurve trades={monthTrades} />
          </>
        ) : (
          <p className="stats-placeholder">Pick a month to see its stats.</p>
        )}
      </section>
    </div>
  )
}