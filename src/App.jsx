import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import HomePage from './pages/HomePage'
import StatsPage from './pages/StatsPage'
import { NUMERIC_FIELDS } from './constants'
import { parseLighterCsv, parseTxflowCsv } from './lib/csvImport'

export default function App() {
  const [page, setPage] = useState('home')
  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingTrade, setEditingTrade] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchTrades()
  }, [])

  async function fetchTrades() {
    setLoading(true)
    setError('')
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .order('trade_date', { ascending: false })
    if (error) {
      setError(error.message)
    } else {
      setTrades(data)
    }
    setLoading(false)
  }

  function cleanPayload(trade) {
    const payload = { ...trade }
    delete payload.id
    delete payload.created_at
    NUMERIC_FIELDS.forEach((f) => {
      payload[f] = payload[f] === '' ? null : Number(payload[f])
    })
    if (payload.trade_date === '') payload.trade_date = null
    if (payload.exit_datetime === '') payload.exit_datetime = null
    return payload
  }

  async function handleSave(trade) {
    setSaving(true)
    setError('')
    const payload = cleanPayload(trade)
    let res
    if (trade.id) {
      res = await supabase.from('trades').update(payload).eq('id', trade.id)
    } else {
      res = await supabase.from('trades').insert(payload)
    }
    setSaving(false)
    if (res.error) {
      setError(res.error.message)
      return
    }
    setShowForm(false)
    setEditingTrade(null)
    fetchTrades()
  }

  async function handleDelete(id) {
    if (!confirm('Delete this trade? This cannot be undone.')) return
    const { error } = await supabase.from('trades').delete().eq('id', id)
    if (error) {
      setError(error.message)
      return
    }
    fetchTrades()
  }

  function handleEdit(trade) {
    setEditingTrade(trade)
    setShowForm(true)
    setPage('home')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleNewTrade() {
    setEditingTrade(null)
    setShowForm(true)
  }

  function draftPayloads(complete) {
    return complete.map((p) => ({
      trade_date: p.trade_date,
      screenshot_trade: [],
      screenshot_context: [],
      screenshot_day: [],
      strategy: null,
      direction: p.direction,
      setup_grade: null,
      entry_price: p.entry_price,
      position_size_usd: p.position_size_usd,
      position_size_units: p.position_size_units,
      account_risk: null,
      stop_loss: null,
      take_profit: null,
      r: null,
      fees: p.fees,
      exit_price: p.exit_price,
      exit_datetime: p.exit_datetime,
      context: null,
      entry_reason: null,
      reason_for_cutting: null,
      cut_result: null,
      feelings: null,
      lessons: null,
      would_take_again: null,
    }))
  }

  async function importParsedCsv(file, parser, failMessage) {
    setError('')
    try {
      const text = await file.text()
      const { complete, orphanClose, trailingOpen } = parser(text)
      if (!complete.length) {
        const hints = []
        if (orphanClose) hints.push('close-only row(s) without a matching open in this file')
        if (trailingOpen) hints.push('open-only row(s) without a close yet')
        const suffix = hints.length ? ` (${hints.join('; ')})` : ''
        setError(`No complete open+close trade pairs found in this CSV.${suffix}`)
        return
      }
      const payloads = draftPayloads(complete)
      const { error } = await supabase.from('trades').insert(payloads)
      if (error) {
        setError(error.message)
        return
      }
      fetchTrades()
      const skipped = []
      if (orphanClose) skipped.push('close-only fill(s) from a prior session')
      if (trailingOpen) skipped.push('still-open position fill(s)')
      const skippedNote =
        skipped.length > 0
          ? `\n\nSkipped: ${skipped.join(' and ')} — re-import after those legs appear in an export, or enter them manually.`
          : ''
      alert(
        `Imported ${payloads.length} trade${payloads.length !== 1 ? 's' : ''} as drafts — open each to add screenshots, strategy, and notes.${skippedNote}`
      )
    } catch (err) {
      setError(err.message || failMessage)
    }
  }

  async function handleImportCsv(file) {
    await importParsedCsv(file, parseLighterCsv, 'Failed to import CSV')
  }

  async function handleImportTxflow(file) {
    await importParsedCsv(file, parseTxflowCsv, 'Failed to import txflow CSV')
  }

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>JOURNAL</h1>
          <p className="subtitle">Discipline. Patience. No fear.</p>
        </div>
        <nav className="nav-tabs">
          <button className={`nav-tab ${page === 'home' ? 'active' : ''}`} onClick={() => setPage('home')}>
            Home
          </button>
          <button className={`nav-tab ${page === 'stats' ? 'active' : ''}`} onClick={() => setPage('stats')}>
            Stats
          </button>
        </nav>
      </header>

      {error && <div className="banner-error">{error}</div>}

      {page === 'home' ? (
        <HomePage
          trades={trades}
          loading={loading}
          showForm={showForm}
          editingTrade={editingTrade}
          saving={saving}
          onNewTrade={handleNewTrade}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false)
            setEditingTrade(null)
          }}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onImportCsv={handleImportCsv}
          onImportTxflow={handleImportTxflow}
        />
      ) : (
        <StatsPage trades={trades} />
      )}
    </div>
  )
}