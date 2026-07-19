import { useState, useEffect } from "react";
import ImageField from "./ImageField";
import {
  STRATEGY_OPTIONS,
  DIRECTION_OPTIONS,
  AGAIN_OPTIONS,
  EMPTY_TRADE,
} from "../constants";

export default function TradeForm({ initialTrade, onSave, onCancel, saving }) {
  const [trade, setTrade] = useState(initialTrade || EMPTY_TRADE)
  const [validationError, setValidationError] = useState('')

  useEffect(() => {
    setTrade(initialTrade || EMPTY_TRADE)
  }, [initialTrade])

  function set(field, value) {
    setTrade((t) => ({ ...t, [field]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const missingShots = []
    if (!(trade.screenshot_trade || []).length) missingShots.push('Trade')
    if (!(trade.screenshot_context || []).length) missingShots.push('Footprint / flows')
    if (!(trade.screenshot_day || []).length) missingShots.push('Current day')
    if (missingShots.length) {
      setValidationError(`Add at least one screenshot for: ${missingShots.join(', ')}`)
      return
    }
    setValidationError('')
    onSave(trade)
  }

  return (
    <form className="trade-form" onSubmit={handleSubmit}>
      {validationError && <div className="banner-error">{validationError}</div>}
      <section className="form-section">
        <h3>Setup</h3>
        <div className="grid-2">
          <Field label="Date & time">
            <input
              type="datetime-local"
              value={trade.trade_date || ""}
              onChange={(e) => set("trade_date", e.target.value)}
              required
            />
          </Field>
          <Field label="Strategy">
            <select
              value={trade.strategy || ""}
              onChange={(e) => set("strategy", e.target.value)}
              required
            >
              {STRATEGY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Direction">
            <select
              value={trade.direction || ""}
              onChange={(e) => set("direction", e.target.value)}
              required
            >
              {DIRECTION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Setup grade">
            <input
              type="text"
              placeholder="e.g. A / B / C"
              value={trade.setup_grade || ""}
              onChange={(e) => set("setup_grade", e.target.value)}
              required
            />
          </Field>
        </div>
      </section>

      <section className="form-section">
        <h3>Screenshots</h3>
        <div className="grid-3">
          <ImageField
            label="Trade"
            value={trade.screenshot_trade}
            onChange={(v) => set("screenshot_trade", v)}
          />
          <ImageField
            label="Footprint / flows"
            value={trade.screenshot_context}
            onChange={(v) => set("screenshot_context", v)}
          />
          <ImageField
            label="Current day"
            value={trade.screenshot_day}
            onChange={(v) => set("screenshot_day", v)}
          />
        </div>
      </section>

      <section className="form-section">
        <h3>Execution</h3>
        <div className="grid-3">
          <Field label="Entry price">
            <input
              type="number"
              step="any"
              value={trade.entry_price || ""}
              onChange={(e) => set("entry_price", e.target.value)}
              required
            />
          </Field>
          <Field label="Position size ($)">
            <input
              type="number"
              step="any"
              value={trade.position_size_usd || ""}
              onChange={(e) => set("position_size_usd", e.target.value)}
              required
            />
          </Field>
          <Field label="Position size (units)">
            <input
              type="number"
              step="any"
              value={trade.position_size_units || ""}
              onChange={(e) => set("position_size_units", e.target.value)}
              required
            />
          </Field>
          <Field label="Account risk (%)">
            <input
              type="number"
              step="any"
              value={trade.account_risk || ""}
              onChange={(e) => set("account_risk", e.target.value)}
              required
            />
          </Field>
          <Field label="Stop loss">
            <input
              type="number"
              step="any"
              value={trade.stop_loss || ""}
              onChange={(e) => set("stop_loss", e.target.value)}
              required
            />
          </Field>
          <Field label="Take profit">
            <input
              type="number"
              step="any"
              value={trade.take_profit || ""}
              onChange={(e) => set("take_profit", e.target.value)}
              required
            />
          </Field>
          <Field label="Exit price">
            <input
              type="number"
              step="any"
              value={trade.exit_price || ""}
              onChange={(e) => set("exit_price", e.target.value)}
              required
            />
          </Field>
          <Field label="Exit date & time">
            <input
              type="datetime-local"
              value={trade.exit_datetime || ""}
              onChange={(e) => set("exit_datetime", e.target.value)}
              required
            />
          </Field>
          <Field label="Fees">
            <input
              type="number"
              step="any"
              value={trade.fees || ""}
              onChange={(e) => set("fees", e.target.value)}
              required
            />
          </Field>
          <Field label="Planned R">
            <input
              type="number"
              step="any"
              value={trade.r || ""}
              onChange={(e) => set("r", e.target.value)}
              required
            />
          </Field>
        </div>
      </section>

      <section className="form-section">
        <h3>Trade management</h3>
        <div className="grid-1">
          <Field label="Reason for cutting">
            <textarea
              rows={2}
              value={trade.reason_for_cutting || ""}
              onChange={(e) => set("reason_for_cutting", e.target.value)}
              required
            />
          </Field>
          <Field label="Cut result">
            <textarea
              rows={2}
              value={trade.cut_result || ""}
              onChange={(e) => set("cut_result", e.target.value)}
              required
            />
          </Field>
        </div>
      </section>

      <section className="form-section">
        <h3>Reflection</h3>
        <div className="grid-1">
          <Field label="Daily context">
            <textarea
              rows={2}
              value={trade.context || ""}
              onChange={(e) => set("context", e.target.value)}
              required
            />
          </Field>
          <Field label="Why did you enter">
            <textarea
              rows={2}
              value={trade.entry_reason || ""}
              onChange={(e) => set("entry_reason", e.target.value)}
              required
            />
          </Field>
          <Field label="How did you feel before and after entry">
            <textarea
              rows={2}
              value={trade.feelings || ""}
              onChange={(e) => set("feelings", e.target.value)}
              required
            />
          </Field>
          <Field label="Lessons">
            <textarea
              rows={2}
              value={trade.lessons || ""}
              onChange={(e) => set("lessons", e.target.value)}
              required
            />
          </Field>
          <Field label="Would you take this trade again?">
            <select
              value={trade.would_take_again || ""}
              onChange={(e) => set("would_take_again", e.target.value)}
              required
            >
              {AGAIN_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
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
