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

// Quote-aware parser — txflow prices look like `"81,433 USDC"`.
function parseCsvQuoted(text) {
  const rows = []
  let row = []
  let cell = ''
  let inQuotes = false
  const pushCell = () => {
    row.push(cell.trim())
    cell = ''
  }
  const pushRow = () => {
    if (row.some((c) => c !== '')) rows.push(row)
    row = []
  }
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        cell += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      pushCell()
    } else if (c === '\n') {
      pushCell()
      pushRow()
    } else if (c !== '\r') {
      cell += c
    }
  }
  if (cell !== '' || row.length) {
    pushCell()
    pushRow()
  }
  if (!rows.length) return []
  const headers = rows[0]
  return rows.slice(1).map((cells) => {
    const obj = {}
    headers.forEach((h, i) => (obj[h] = cells[i] || ''))
    return obj
  })
}

function parseAmount(value) {
  const n = Number(String(value).replace(/[^0-9.\-]/g, ''))
  return Number.isFinite(n) ? n : 0
}

function pad2(n) {
  return String(n).padStart(2, '0')
}

// txflow timestamps are IST (UTC+5:30, no DST).
function parseIstToUtc(str) {
  const m = String(str).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}) (\d{1,2}):(\d{2}):(\d{2})$/)
  if (!m) return new Date(NaN)
  const [, month, day, year, hour, minute, second] = m
  return new Date(
    `${year}-${pad2(month)}-${pad2(day)}T${pad2(hour)}:${minute}:${second}+05:30`
  )
}

function round(n, decimals = 2) {
  const factor = 10 ** decimals
  return Math.round(n * factor) / factor
}

function toDatetimeLocal(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`
}

function sumSize(fills) {
  return fills.reduce((s, f) => s + f.size, 0)
}
function sumValue(fills) {
  return fills.reduce((s, f) => s + f.tradeValue, 0)
}
function sumFee(fills) {
  return fills.reduce((s, f) => s + f.fee, 0)
}
function fillIds(fills) {
  return fills.map((f) => f.tradeId)
}

// excludeIds: a Set of Trade IDs (numbers) already imported in a previous
// run — those fills are dropped before grouping, so re-importing an
// overlapping export is a safe no-op for anything already saved.
export function parseLighterCsv(text, excludeIds = new Set()) {
  const rows = parseCsv(text)
    .filter((r) => r.Market && r.Side)
    .map((r) => ({
      side: r.Side,
      date: new Date(r.Date.replace(' ', 'T') + 'Z'),
      tradeValue: Number(r['Trade Value']),
      size: Number(r.Size),
      fee: Number(r.Fee) || 0,
      tradeId: Number(r['Trade ID']),
    }))
    .filter((r) => !excludeIds.has(r.tradeId))
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

  const complete = []
  let orphanClose = null
  let trailingOpen = null

  groups.forEach((g) => {
    const hasOpen = g.openFills.length > 0
    const hasClose = g.closeFills.length > 0

    if (hasOpen && hasClose) {
      const entryUnits = sumSize(g.openFills)
      const entryValue = sumValue(g.openFills)
      const exitUnits = sumSize(g.closeFills)
      const exitValue = sumValue(g.closeFills)
      complete.push({
        trade_date: toDatetimeLocal(g.openFills[0].date),
        direction: g.direction,
        entry_price: round(entryValue / entryUnits),
        position_size_usd: round(entryValue),
        position_size_units: round(entryUnits, 6),
        exit_price: round(exitValue / exitUnits),
        exit_datetime: toDatetimeLocal(g.closeFills[g.closeFills.length - 1].date),
        fees: round(sumFee(g.openFills) + sumFee(g.closeFills)),
        fillIds: [...fillIds(g.openFills), ...fillIds(g.closeFills)],
      })
    } else if (!hasOpen && hasClose) {
      const exitUnits = sumSize(g.closeFills)
      const exitValue = sumValue(g.closeFills)
      orphanClose = {
        direction: g.direction,
        exit_price: round(exitValue / exitUnits),
        position_size_units: round(exitUnits, 6),
        exit_datetime: toDatetimeLocal(g.closeFills[g.closeFills.length - 1].date),
        fees: round(sumFee(g.closeFills)),
        fillIds: fillIds(g.closeFills),
      }
    } else if (hasOpen && !hasClose) {
      const entryUnits = sumSize(g.openFills)
      const entryValue = sumValue(g.openFills)
      trailingOpen = {
        trade_date: toDatetimeLocal(g.openFills[0].date),
        direction: g.direction,
        entry_price: round(entryValue / entryUnits),
        position_size_usd: round(entryValue),
        position_size_units: round(entryUnits, 6),
        fees: round(sumFee(g.openFills)),
        fillIds: fillIds(g.openFills),
      }
    }
  })

  return { complete, orphanClose, trailingOpen }
}

function groupFills(rows, classify) {
  const groups = []
  let current = null
  let seenClose = false

  for (const row of rows) {
    const { phase, direction } = classify(row)

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
  return groups
}

function buildsFromGroups(groups) {
  const complete = []
  let orphanClose = null
  let trailingOpen = null

  groups.forEach((g) => {
    const hasOpen = g.openFills.length > 0
    const hasClose = g.closeFills.length > 0

    if (hasOpen && hasClose) {
      const entryUnits = sumSize(g.openFills)
      const entryValue = sumValue(g.openFills)
      const exitUnits = sumSize(g.closeFills)
      const exitValue = sumValue(g.closeFills)
      const entry_price = round(entryValue / entryUnits)
      const exit_price = round(exitValue / exitUnits)
      const position_size_units = round(entryUnits, 6)
      const realizedPnl = g.realizedPnl
      const pricePnl =
        (g.direction === 'short' ? entry_price - exit_price : exit_price - entry_price) *
        position_size_units
      const fees =
        realizedPnl == null ? round(sumFee(g.openFills) + sumFee(g.closeFills)) : round(pricePnl - realizedPnl)
      complete.push({
        trade_date: toDatetimeLocal(g.openFills[0].date),
        direction: g.direction,
        entry_price,
        position_size_usd: round(entryValue),
        position_size_units,
        exit_price,
        exit_datetime: toDatetimeLocal(g.closeFills[g.closeFills.length - 1].date),
        fees,
        fillIds: [...fillIds(g.openFills), ...fillIds(g.closeFills)],
      })
    } else if (!hasOpen && hasClose) {
      const exitUnits = sumSize(g.closeFills)
      const exitValue = sumValue(g.closeFills)
      orphanClose = {
        direction: g.direction,
        exit_price: round(exitValue / exitUnits),
        position_size_units: round(exitUnits, 6),
        exit_datetime: toDatetimeLocal(g.closeFills[g.closeFills.length - 1].date),
        fees: round(sumFee(g.closeFills)),
        fillIds: fillIds(g.closeFills),
      }
    } else if (hasOpen && !hasClose) {
      const entryUnits = sumSize(g.openFills)
      const entryValue = sumValue(g.openFills)
      trailingOpen = {
        trade_date: toDatetimeLocal(g.openFills[0].date),
        direction: g.direction,
        entry_price: round(entryValue / entryUnits),
        position_size_usd: round(entryValue),
        position_size_units: round(entryUnits, 6),
        fees: round(sumFee(g.openFills)),
        fillIds: fillIds(g.openFills),
      }
    }
  })

  return { complete, orphanClose, trailingOpen }
}

export function parseTxflowCsv(text) {
  const rows = parseCsvQuoted(text)
    .filter((r) => r.Symbol && r.Side && r['Filled Time'])
    .map((r) => {
      const closedPnl = parseAmount(r['Closed PnL'])
      const side = r.Side
      const isOpen = closedPnl === 0
      return {
        side,
        date: parseIstToUtc(r['Filled Time']),
        tradeValue: parseAmount(r['Trade Value']),
        size: parseAmount(r['Filled Amount']),
        fee: parseAmount(r.Fee) || 0,
        closedPnl,
        isOpen,
        tradeId: `${r['Filled Time']}|${side}|${r['Filled Amount']}|${r.Price}|${r['Trade Value']}`,
      }
    })
    .filter((r) => !Number.isNaN(r.date.getTime()))
    .sort((a, b) => a.date - b.date)

  const groups = groupFills(rows, (row) => {
    const phase = row.isOpen ? 'open' : 'close'
    const direction = row.isOpen
      ? row.side === 'Sell'
        ? 'short'
        : 'long'
      : row.side === 'Buy'
        ? 'short'
        : 'long'
    return { phase, direction }
  }).map((g) => ({
    ...g,
    // Journal PnL = sum(Closed PnL on closes) − opening fees (close fees are already in Closed PnL).
    realizedPnl: round(g.closeFills.reduce((s, f) => s + f.closedPnl, 0) - sumFee(g.openFills)),
  }))

  return buildsFromGroups(groups)
}