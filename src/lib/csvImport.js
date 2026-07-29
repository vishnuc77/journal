function parseCsv(text) {
    const lines = text.trim().split(/\r?\n/)
    const headers = lines[0].split(',').map((h) => h.trim())
    return lines.slice(1).map((line) => {
      const cells = line.split(',')
      const row = {}
      headers.forEach((h, i) => (row[h] = (cells[i] || '').trim()))
      return row
    })
  }
  
  function round(n, decimals = 2) {
    const factor = 10 ** decimals
    return Math.round(n * factor) / factor
  }
  
  function toDatetimeLocal(date) {
    const pad = (n) => String(n).padStart(2, '0')
    return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`
  }
  
  export function parseLighterCsv(text) {
    const rows = parseCsv(text)
      .filter((r) => r.Market && r.Side)
      .map((r) => ({
        side: r.Side, // "Open Short" | "Close Short" | "Open Long" | "Close Long"
        date: new Date(r.Date.replace(' ', 'T') + 'Z'),
        tradeValue: Number(r['Trade Value']),
        size: Number(r.Size),
        fee: Number(r.Fee) || 0,
      }))
      .sort((a, b) => a.date - b.date)
  
    const groups = []
    let current = null
    let seenClose = false
  
    for (const row of rows) {
      const phase = row.side.startsWith('Open') ? 'open' : 'close'
      const direction = row.side.endsWith('Short') ? 'short' : 'long'
  
      if (phase === 'open' && (current === null || seenClose)) {
        if (current) groups.push(current)
        current = { direction, openFills: [], closeFills: [] }
        seenClose = false
      }
      if (!current) current = { direction, openFills: [], closeFills: [] }
  
      if (phase === 'open') current.openFills.push(row)
      else {
        current.closeFills.push(row)
        seenClose = true
      }
    }
    if (current) groups.push(current)
  
    const sumSize = (fills) => fills.reduce((s, f) => s + f.size, 0)
    const sumValue = (fills) => fills.reduce((s, f) => s + f.tradeValue, 0)
    const sumFee = (fills) => fills.reduce((s, f) => s + f.fee, 0)
  
    return groups
      .filter((g) => g.openFills.length && g.closeFills.length)
      .map((g) => {
        const entryUnits = sumSize(g.openFills)
        const entryValue = sumValue(g.openFills)
        const exitUnits = sumSize(g.closeFills)
        const exitValue = sumValue(g.closeFills)
        return {
          trade_date: toDatetimeLocal(g.openFills[0].date),
          direction: g.direction,
          entry_price: round(entryValue / entryUnits),
          position_size_usd: round(entryValue),
          position_size_units: round(entryUnits, 6),
          exit_price: round(exitValue / exitUnits),
          exit_datetime: toDatetimeLocal(g.closeFills[g.closeFills.length - 1].date),
          fees: round(sumFee(g.openFills) + sumFee(g.closeFills)),
        }
      })
  }