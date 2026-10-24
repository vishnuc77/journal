import { useMemo, useRef } from "react";
import AltTradeForm from "../components/AltTradeForm";
import AltTradeList from "../components/AltTradeList";
import StatsBlock from "../components/StatsBlock";
import { computeAltStats, monthKey } from "../lib/stats";

const ALT_FIELDS = [
  "totalTrades",
  "wins",
  "losses",
  "avgWin",
  "avgLoss",
  "pnl",
  "holdTime",
  "avgWinHoldTime",
  "avgLossHoldTime",
];

export default function AltsPage({
  trades,
  loading,
  showForm,
  editingTrade,
  saving,
  onNewTrade,
  onSave,
  onCancel,
  onEdit,
  onDelete,
  onImportCsv,
  onImportTxflow,
}) {
  const fileInputRef = useRef(null);
  const txflowInputRef = useRef(null);

  function handleFileChange(e, importer) {
    const file = e.target.files?.[0];
    if (file) importer(file);
    e.target.value = "";
  }

  const overallStats = useMemo(() => computeAltStats(trades), [trades]);
  const currentMonthKey = monthKey(new Date().toISOString());
  const currentMonthTrades = useMemo(
    () => trades.filter((t) => monthKey(t.trade_date) === currentMonthKey),
    [trades, currentMonthKey]
  );
  const monthStats = useMemo(() => computeAltStats(currentMonthTrades), [currentMonthTrades]);

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
              style={{ display: "none" }}
              onChange={(e) => handleFileChange(e, onImportCsv)}
            />
            <button className="btn-secondary" onClick={() => txflowInputRef.current?.click()}>
              Import txflow
            </button>
            <input
              ref={txflowInputRef}
              type="file"
              accept=".csv"
              style={{ display: "none" }}
              onChange={(e) => handleFileChange(e, onImportTxflow)}
            />
            <button className="btn-primary" onClick={onNewTrade}>
              + New trade
            </button>
          </>
        )}
      </div>

      {showForm && (
        <AltTradeForm initialTrade={editingTrade} onSave={onSave} onCancel={onCancel} saving={saving} />
      )}

      {trades.length > 0 && (
        <div className="stats-row">
          <StatsBlock title="Overall" stats={overallStats} fields={ALT_FIELDS} />
          <StatsBlock title="This month" stats={monthStats} fields={ALT_FIELDS} />
        </div>
      )}

      {loading ? (
        <div className="empty-state">
          <p>Loading alt trades…</p>
        </div>
      ) : (
        <AltTradeList trades={trades} onEdit={onEdit} onDelete={onDelete} />
      )}
    </div>
  );
}
