import { useState, useEffect } from "react";
import ImageField from "./ImageField";
import { EMPTY_ALT_TRADE } from "../constants";

function toDatetimeLocalValue(value) {
  if (!value) return "";
  return value.slice(0, 16);
}

export default function AltTradeForm({ initialTrade, onSave, onCancel, saving, coinOptions = [] }) {
  const [trade, setTrade] = useState(initialTrade || EMPTY_ALT_TRADE);

  useEffect(() => {
    if (initialTrade) {
      setTrade({
        ...initialTrade,
        trade_date: toDatetimeLocalValue(initialTrade.trade_date),
        exit_datetime: toDatetimeLocalValue(initialTrade.exit_datetime),
      });
    } else {
      setTrade(EMPTY_ALT_TRADE);
    }
  }, [initialTrade]);

  function set(field, value) {
    setTrade((t) => ({ ...t, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSave(trade);
  }

  return (
    <form className="trade-form" onSubmit={handleSubmit}>
      <section className="form-section">
        <h3>Trade</h3>
        <div className="grid-2">
          <Field label="Coin">
            <input
              type="text"
              list="alt-coin-options"
              placeholder="e.g. ETH"
              value={trade.coin || ""}
              onChange={(e) => set("coin", e.target.value.toUpperCase())}
            />
            <datalist id="alt-coin-options">
              {coinOptions.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
          <Field label="Entry date & time">
            <input
              type="datetime-local"
              value={trade.trade_date || ""}
              onChange={(e) => set("trade_date", e.target.value)}
            />
          </Field>
          <Field label="Exit date & time">
            <input
              type="datetime-local"
              value={trade.exit_datetime || ""}
              onChange={(e) => set("exit_datetime", e.target.value)}
            />
          </Field>
          <Field label="PnL">
            <input
              type="number"
              step="any"
              value={trade.pnl ?? ""}
              onChange={(e) => set("pnl", e.target.value)}
            />
          </Field>
        </div>
      </section>

      <section className="form-section">
        <h3>Screenshots</h3>
        <ImageField
          label="Screenshots"
          value={trade.screenshots}
          onChange={(v) => set("screenshots", v)}
        />
      </section>

      <section className="form-section">
        <h3>Notes</h3>
        <div className="grid-1">
          <Field label="Notes">
            <textarea
              rows={4}
              value={trade.notes || ""}
              onChange={(e) => set("notes", e.target.value)}
            />
          </Field>
        </div>
      </section>

      <div className="form-actions">
        {onCancel && (
          <button type="button" className="btn-ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Saving…" : "Save trade"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}
