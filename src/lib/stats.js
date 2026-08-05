function toNum(v) {
    if (v === null || v === undefined || v === '') return null
    const n = Number(v)
    return isNaN(n) ? null : n
  }
  
  export function tradePnl(t) {
    const entry = toNum(t.entry_price)
    const exit = toNum(t.exit_price)
    const units = toNum(t.position_size_units)
    if (entry === null || exit === null || units === null) return null
    const diff = t.direction === 'short' ? entry - exit : exit - entry
    return diff * units - (toNum(t.fees) || 0)
  }
  
  export function tradeHoldMinutes(t) {
    if (!t.trade_date || !t.exit_datetime) return null
    const start = new Date(t.trade_date).getTime()
    const end = new Date(t.exit_datetime).getTime()
    if (isNaN(start) || isNaN(end) || end < start) return null
    return (end - start) / 60000
  }

  export function tradeRealizedR(t) {
    const entry = toNum(t.entry_price)
    const exit = toNum(t.exit_price)
    const stop = toNum(t.stop_loss)
    const units = toNum(t.position_size_units)
    if (entry === null || exit === null || stop === null || units === null) return null
    const riskPerUnit = Math.abs(entry - stop)
    const riskAmount = riskPerUnit * units
    if (riskAmount === 0) return null
    const pnl = tradePnl(t)
    if (pnl === null) return null
    return pnl / riskAmount
  }
  
  export function computeStats(trades) {
    const realizedRs = trades.map((t) => tradeRealizedR(t)).filter((r) => r !== null)
    const withR = trades.filter((t) => tradeRealizedR(t) !== null)
    const wins = withR.filter((t) => tradeRealizedR(t) > 0)
    const losses = withR.filter((t) => tradeRealizedR(t) < 0)
    const totalR = realizedRs.reduce((s, r) => s + r, 0)
  
    const pnls = trades.map((t) => tradePnl(t)).filter((p) => p !== null)
    const winPnls = pnls.filter((p) => p > 0)
    const lossPnls = pnls.filter((p) => p < 0)
    const totalPnl = pnls.reduce((s, p) => s + p, 0)
    const avgWin = winPnls.length ? winPnls.reduce((s, p) => s + p, 0) / winPnls.length : null
    const avgLoss = lossPnls.length ? lossPnls.reduce((s, p) => s + p, 0) / lossPnls.length : null
    const grossWin = winPnls.reduce((s, p) => s + p, 0)
    const grossLoss = Math.abs(lossPnls.reduce((s, p) => s + p, 0))
    const profitFactor = grossLoss > 0 ? grossWin / grossLoss : null
  
    const avg = (arr) => (arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : null)
    const holds = trades.map((t) => tradeHoldMinutes(t)).filter((h) => h !== null)
    const winHolds = wins.map((t) => tradeHoldMinutes(t)).filter((h) => h !== null)
    const lossHolds = losses.map((t) => tradeHoldMinutes(t)).filter((h) => h !== null)
  
    return {
      totalTrades: trades.length,
      wins: wins.length,
      losses: losses.length,
      totalR,
      avgWin,
      avgLoss,
      pnl: totalPnl,
      profitFactor,
      holdTime: avg(holds),
      avgWinHoldTime: avg(winHolds),
      avgLossHoldTime: avg(lossHolds),
    }
  }
  
  export function formatHoldTime(minutes) {
    if (minutes === null || minutes === undefined) return '—'
    const m = Math.round(minutes)
    if (m < 60) return `${m}m`
    const h = Math.floor(m / 60)
    const rem = m % 60
    return rem ? `${h}h ${rem}m` : `${h}h`
  }
  
  export function formatCurrency(n) {
    if (n === null || n === undefined) return '—'
    return `${n > 0 ? '+' : ''}${n.toFixed(2)}$`
  }
  
  export function formatR(n) {
    if (n === null || n === undefined) return '—'
    return `${n > 0 ? '+' : ''}${n.toFixed(2)}R`
  }
  
  export function monthKey(dateStr) {
    if (!dateStr) return null
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return null
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }
  
  export function monthLabel(key) {
    const [y, m] = key.split('-')
    const d = new Date(Number(y), Number(m) - 1, 1)
    return d.toLocaleString('default', { month: 'long', year: 'numeric' })
  }
  
  export function groupByMonth(trades) {
    const groups = {}
    trades.forEach((t) => {
      const key = monthKey(t.trade_date) || 'unknown'
      if (!groups[key]) groups[key] = []
      groups[key].push(t)
    })
    return groups
  }

  export function dayKey(dateStr) {
    if (!dateStr) return null
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return null
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
  
  export function groupByDayPnl(trades) {
    const byDay = {}
    trades.forEach((t) => {
      const key = dayKey(t.trade_date)
      if (!key) return
      const pnl = tradePnl(t)
      if (pnl === null) return
      byDay[key] = (byDay[key] || 0) + pnl
    })
    return byDay
  }
  
  export const STAT_FIELDS = {
    totalTrades: { label: 'Total trades', format: (v) => v },
    wins: { label: 'Wins', format: (v) => v },
    losses: { label: 'Losses', format: (v) => v },
    totalR: { label: 'Total R', format: formatR, tone: (v) => (v > 0 ? 'long' : v < 0 ? 'short' : null) },
    avgWin: { label: 'Average win', format: formatCurrency, tone: () => 'long' },
    avgLoss: { label: 'Average loss', format: formatCurrency, tone: () => 'short' },
    pnl: { label: 'PnL', format: formatCurrency, tone: (v) => (v > 0 ? 'long' : v < 0 ? 'short' : null) },
    profitFactor: { label: 'Profit factor', format: (v) => (v === null ? '—' : v.toFixed(2)) },
    holdTime: { label: 'Hold time', format: formatHoldTime },
    avgWinHoldTime: { label: 'Avg win hold time', format: formatHoldTime },
    avgLossHoldTime: { label: 'Avg loss hold time', format: formatHoldTime },
  }