import { useState } from 'react'
import { tradePnl, tradeRealizedR, tradeHoldMinutes, formatHoldTime, formatCurrency, monthKey, monthLabel, formatR } from '../lib/stats'

export default function TradeList({ trades, onEdit, onDelete }) {
  const currentMonthKey = monthKey(new Date().toISOString())
  const [openMonths, setOpenMonths] = useState(() => new Set([currentMonthKey]))
  const [openTradeId, setOpenTradeId] = useState(null)

  if (trades.length === 0) {
    return (
      <div className="empty-state">
        <p>No trades logged yet. Add your first one above.</p>
      </div>
    )
  }

  const groups = {}
  trades.forEach((t) => {
    const key = monthKey(t.trade_date) || 'unknown'
    if (!groups[key]) groups[key] = []
    groups[key].push(t)
  })
  const orderedKeys = Object.keys(groups).sort().reverse()

  function toggleMonth(key) {
    setOpenMonths((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  return (
    <div className="trade-list">
      {orderedKeys.map((key) => {
        const monthTrades = groups[key]
        const isOpen = openMonths.has(key)
        return (
          <div key={key} className="month-group">
            <button className="month-header" onClick={() => toggleMonth(key)}>
              <span>{key === 'unknown' ? 'No date' : monthLabel(key)}</span>
              <span className="month-header-meta">
                {monthTrades.length} trade{monthTrades.length !== 1 ? 's' : ''}
                <span className="month-chevron">{isOpen ? '−' : '+'}</span>
              </span>
            </button>
            {isOpen && (
              <div className="month-trades">
                <div className="trade-row trade-row-head">
                  <span className="cell">Date</span>
                  <span className="cell">Dir</span>
                  <span className="cell">Qty</span>
                  <span className="cell">Entry</span>
                  <span className="cell">Exit</span>
                  <span className="cell">Hold</span>
                  <span className="cell">PnL</span>
                  <span className="cell">R</span>
                  <span className="cell" />
                </div>
                {monthTrades.map((t) => (
                  <TradeRow
                    key={t.id}
                    trade={t}
                    isOpen={openTradeId === t.id}
                    onToggle={() => setOpenTradeId(openTradeId === t.id ? null : t.id)}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function TradeRow({ trade: t, isOpen, onToggle, onEdit, onDelete }) {
  const pnl = tradePnl(t)
  const realizedR = tradeRealizedR(t)
  const holdMin = tradeHoldMinutes(t)
  const dateLabel = t.trade_date
    ? new Date(t.trade_date).toLocaleString('default', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : '—'

  return (
    <div className="trade-row-wrap">
      <button className="trade-row" onClick={onToggle}>
        <span className="cell cell-date">{dateLabel}</span>
        <span className={`cell tag tag-${t.direction || 'none'}`}>
          {t.direction ? t.direction.toUpperCase() : '—'}
        </span>
        <span className="cell">{t.position_size_units ?? '—'}</span>
        <span className="cell">{t.entry_price ?? '—'}</span>
        <span className="cell">{t.exit_price ?? '—'}</span>
        <span className="cell">{formatHoldTime(holdMin)}</span>
        <span className={`cell ${pnl > 0 ? 'tone-long' : pnl < 0 ? 'tone-short' : ''}`}>
          {pnl !== null ? formatCurrency(pnl) : '—'}
        </span>
        <span className={`cell ${realizedR > 0 ? 'tone-long' : realizedR < 0 ? 'tone-short' : ''}`}>
          {realizedR !== null ? formatR(realizedR) : '—'}
        </span>
        <span className="cell cell-chevron">{isOpen ? '−' : '+'}</span>
      </button>
      {isOpen && <TradeDetail trade={t} onEdit={onEdit} onDelete={onDelete} />}
    </div>
  )
}

function TradeDetail({ trade, onEdit, onDelete }) {
  const shotGroups = [
    { label: "Trade", urls: trade.screenshot_trade || [] },
    { label: "Footprint / flows", urls: trade.screenshot_context || [] },
    { label: "Current day", urls: trade.screenshot_day || [] },
  ].filter((g) => g.urls.length > 0);

  return (
    <div className="trade-detail">
      {shotGroups.length > 0 && (
        <div className="detail-shots">
          {shotGroups.map((g) => (
            <div key={g.label} className="shot-group">
              <span className="shot-group-label">{g.label}</span>
              <div className="shot-group-images">
                {g.urls.map((url, i) => (
                  <a
                    key={url + i}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="shot"
                  >
                    <img src={url} alt={`${g.label} ${i + 1}`} />
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="detail-grid">
        <Detail label="Entry" value={trade.entry_price} />
        <Detail label="Exit" value={trade.exit_price} />
        <Detail label="Exit at" value={trade.exit_datetime} />
        <Detail label="Stop loss" value={trade.stop_loss} />
        <Detail label="Take profit" value={trade.take_profit} />
        <Detail label="Size ($)" value={trade.position_size_usd} />
        <Detail label="Size (units)" value={trade.position_size_units} />
        <Detail
          label="Account risk"
          value={trade.account_risk && `${trade.account_risk}%`}
        />
        <Detail label="Fees" value={trade.fees} />
        <Detail label="Planned R" value={trade.r} />
        <Detail label="Would repeat" value={trade.would_take_again} />
      </div>

      <div className="detail-notes">
        <Note label="Reason for cutting" text={trade.reason_for_cutting} />
        <Note label="Cut result" text={trade.cut_result} />
        <Note label="Daily context" text={trade.context} />
        <Note label="Why did you enter" text={trade.entry_reason} />
        <Note label="Feelings before/after" text={trade.feelings} />
        <Note label="Lessons" text={trade.lessons} />
      </div>

      <div className="detail-actions">
        <button className="btn-ghost btn-small" onClick={() => onEdit(trade)}>
          Edit
        </button>
        <button
          className="btn-danger btn-small"
          onClick={() => onDelete(trade.id)}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="detail-item">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value}</span>
    </div>
  );
}

function Note({ label, text }) {
  if (!text) return null;
  return (
    <div className="note">
      <span className="note-label">{label}</span>
      <p>{text}</p>
    </div>
  );
}
