export const STRATEGY_OPTIONS = [
  { value: "", label: "Select strategy" },
  { value: "reversion", label: "Reversion" },
  { value: "momentum", label: "Momentum" },
];

export const DIRECTION_OPTIONS = [
  { value: "", label: "Select direction" },
  { value: "long", label: "Long" },
  { value: "short", label: "Short" },
];

export const AGAIN_OPTIONS = [
  { value: "", label: "Select" },
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "unsure", label: "Unsure" },
];

export const EMPTY_TRADE = {
  trade_date: "",
  screenshot_trade: [],
  screenshot_context: [],
  screenshot_day: [],
  strategy: "",
  direction: "",
  setup_grade: "",
  entry_price: "",
  position_size_usd: "",
  position_size_units: "",
  account_risk: "",
  stop_loss: "",
  take_profit: "",
  r: "",
  fees: "",
  exit_price: "",
  exit_datetime: "",
  context: "",
  entry_reason: "",
  reason_for_cutting: "",
  cut_result: "",
  feelings: "",
  lessons: "",
  would_take_again: "",
};

export const EMPTY_ALT_TRADE = {
  coin: "",
  trade_date: "",
  exit_datetime: "",
  pnl: "",
  screenshots: [],
  notes: "",
};

export const NUMERIC_FIELDS = [
  "entry_price",
  "position_size_usd",
  "position_size_units",
  "account_risk",
  "stop_loss",
  "take_profit",
  "r",
  "fees",
  "exit_price",
];
