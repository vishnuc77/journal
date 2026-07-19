import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import HomePage from './pages/HomePage'
import StatsPage from './pages/StatsPage'
import { NUMERIC_FIELDS } from './constants'

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
        />
      ) : (
        <StatsPage trades={trades} />
      )}
    </div>
  )
}