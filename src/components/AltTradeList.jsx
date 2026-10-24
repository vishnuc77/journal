import { useState } from "react";
import { tradeHoldMinutes, formatHoldTime, formatCurrency, monthKey, monthLabel } from "../lib/stats";

function toPnl(t) {
  if (t.pnl === null || t.pnl === undefined || t.pnl === "") return null;
  const n = Number(t.pnl);
  return Number.isFinite(n) ? n : null;
}

export default function AltTradeList({ trades, onEdit, onDelete }) {
  const currentMonthKey = monthKey(new Date().toISOString());
  const [openMonths, setOpenMonths] = useState(() => new Set([currentMonthKey]));
  const [openTradeId, setOpenTradeId] = useState(null);

  if (trades.length === 0) {
    return (
      <div className="empty-state">
        <p>No alt trades logged yet. Add your first one above.</p>
      </div>
    );
  }

  const groups = {};
  trades.forEach((t) => {
    const key = monthKey(t.trade_date) || "unknown";
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  });
  const orderedKeys = Object.keys(groups).sort().reverse();

  function toggleMonth(key) {
    setOpenMonths((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  return (
    <div className="trade-list">
      {orderedKeys.map((key) => {
        const monthTrades = groups[key];
        const isOpen = openMonths.has(key);
        return (
          <div key={key} className="month-group">
            <button className="month-header" onClick={() => toggleMonth(key)}>
              <span>{key === "unknown" ? "No date" : monthLabel(key)}</span>
              <span className="month-header-meta">
                {monthTrades.length} trade{monthTrades.length !== 1 ? "s" : ""}
                <span className="month-chevron">{isOpen ? "−" : "+"}</span>
              </span>
            </button>
            {isOpen && (
              <div className="month-trades">
                <div className="trade-row trade-row-head alt-trade-row">
                  <span className="cell">Coin</span>
                  <span className="cell">Entry</span>
                  <span className="cell">Exit</span>
                  <span className="cell">Hold</span>
                  <span className="cell">PnL</span>
                  <span className="cell" />
                </div>
                {monthTrades.map((t) => (
                  <AltTradeRow
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
        );
      })}
    </div>
  );
}

function formatWhen(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("default", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AltTradeRow({ trade: t, isOpen, onToggle, onEdit, onDelete }) {
  const pnl = toPnl(t);
  const holdMin = tradeHoldMinutes(t);
  const notesPreview = t.notes ? t.notes.replace(/\s+/g, " ").slice(0, 48) : "—";

  return (
    <div className="trade-row-wrap">
      <button className="trade-row alt-trade-row" onClick={onToggle}>
        <span className="cell cell-coin">{t.coin ? t.coin.toUpperCase() : "—"}</span>
        <span className="cell cell-date">{formatWhen(t.trade_date)}</span>
        <span className="cell">{formatWhen(t.exit_datetime)}</span>
        <span className="cell">{formatHoldTime(holdMin)}</span>
        <span className={`cell ${pnl > 0 ? "tone-long" : pnl < 0 ? "tone-short" : ""}`}>
          {pnl !== null ? formatCurrency(pnl) : "—"}
        </span>
        <span className="cell cell-chevron">{isOpen ? "−" : "+"}</span>
      </button>
      {isOpen && <AltTradeDetail trade={t} onEdit={onEdit} onDelete={onDelete} />}
    </div>
  );
}

function AltTradeDetail({ trade, onEdit, onDelete }) {
  const shots = trade.screenshots || [];

  return (
    <div className="trade-detail">
      {shots.length > 0 && (
        <div className="detail-shots">
          <div className="shot-group">
            <span className="shot-group-label">Screenshots</span>
            <div className="shot-group-images">
              {shots.map((url, i) => (
                <a key={url + i} href={url} target="_blank" rel="noreferrer" className="shot">
                  <img src={url} alt={`Screenshot ${i + 1}`} />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="detail-grid">
        <Detail label="Coin" value={trade.coin} />
        <Detail label="Entry" value={trade.trade_date} />
        <Detail label="Exit" value={trade.exit_datetime} />
        <Detail label="PnL" value={trade.pnl} />
      </div>

      {trade.notes && (
        <div className="detail-notes">
          <div className="note">
            <span className="note-label">Notes</span>
            <p>{trade.notes}</p>
          </div>
        </div>
      )}

      <div className="detail-actions">
        <button className="btn-ghost btn-small" onClick={() => onEdit(trade)}>
          Edit
        </button>
        <button className="btn-danger btn-small" onClick={() => onDelete(trade.id)}>
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
