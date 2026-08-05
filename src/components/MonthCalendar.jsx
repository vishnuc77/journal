import { useMemo } from 'react'
import { groupByDayPnl, formatCurrency } from '../lib/stats'

export default function MonthCalendar({ monthKeyStr, trades }) {
  const dayPnl = useMemo(() => groupByDayPnl(trades), [trades])

  const [year, month] = monthKeyStr.split('-').map(Number)
  const firstOfMonth = new Date(year, month - 1, 1)
  const daysInMonth = new Date(year, month, 0).getDate()
  const startWeekday = firstOfMonth.getDay() // 0 = Sunday

  const cells = []
  for (let i = 0; i < startWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div className="month-calendar">
      <div className="calendar-weekdays">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="calendar-grid">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} className="calendar-cell empty" />
          const key = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const pnl = dayPnl[key]
          const tone = pnl > 0 ? 'long' : pnl < 0 ? 'short' : null
          return (
            <div key={i} className={`calendar-cell ${tone ? `tone-bg-${tone}` : ''}`}>
              <span className="calendar-day-num">{day}</span>
              {pnl !== undefined && (
                <span className={`calendar-day-pnl ${tone ? `tone-${tone}` : ''}`}>
                  {formatCurrency(pnl)}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}