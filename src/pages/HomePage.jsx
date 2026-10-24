import { useMemo, useRef } from 'react'
import TradeForm from '../components/TradeForm'
import TradeList from '../components/TradeList'
import StatsBlock from '../components/StatsBlock'
import { computeStats, monthKey } from '../lib/stats'

const OVERALL_FIELDS = [
  'totalTrades', 'wins', 'losses', 'totalR', 'avgWin', 'avgLoss',
  'pnl', 'profitFactor', 'holdTime', 'avgWinHoldTime', 'avgLossHoldTime',
]
const MONTH_FIELDS = ['totalTrades', 'wins', 'losses', 'totalR', 'avgWin', 'avgLoss', 'pnl']

export default function HomePage({
  trades, loading, showForm, editingTrade, saving,
  onNewTrade, onSave, onCancel, onEdit, onDelete, onImportCsv, onImportTxflow,
}) {
  const fileInputRef = useRef(null)
  const txflowInputRef = useRef(null)

  function handleFileChange(e, importer) {
    const file = e.target.files?.[0]
    if (file) importer(file)
    e.target.value = ''
  }
  const overallStats = useMemo(() => computeStats(trades), [trades])
  const currentMonthKey = monthKey(new Date().toISOString())
  const currentMonthTrades = useMemo(
    () => trades.filter((t) => monthKey(t.trade_date) === currentMonthKey),
    [trades, currentMonthKey]
  )
  const monthStats = useMemo(() => computeStats(currentMonthTrades), [currentMonthTrades])

  return (
    <div>
      <div className="page-actions">
        {!showForm && (
          <>
            <button className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
              Import CSV
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              style={{ display: 'none' }}
              onChange={(e) => handleFileChange(e, onImportCsv)}
            />
            <button className="btn-secondary" onClick={() => txflowInputRef.current?.click()}>
              Import txflow
            </button>
            <input
              ref={txflowInputRef}
              type="file"
              accept=".csv"
              style={{ display: 'none' }}
              onChange={(e) => handleFileChange(e, onImportTxflow)}
            />
            <button className="btn-primary" onClick={onNewTrade}>
              + New trade
            </button>
          </>
        )}
      </div>

      {showForm && (
        <TradeForm initialTrade={editingTrade} onSave={onSave} onCancel={onCancel} saving={saving} />
      )}

      {trades.length > 0 && (
        <div className="stats-row">
          <StatsBlock title="Overall" stats={overallStats} fields={OVERALL_FIELDS} />
          <StatsBlock title="This month" stats={monthStats} fields={MONTH_FIELDS} />
        </div>
      )}

      {loading ? (
        <div className="empty-state">
          <p>Loading trades…</p>
        </div>
      ) : (
        <TradeList trades={trades} onEdit={onEdit} onDelete={onDelete} />
      )}
    </div>
  )
}