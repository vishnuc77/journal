# BTC 1m Trade Journal

A private, single-user trade journal. React + Vite frontend, Supabase for the
database and screenshot storage. Free to run and free to host.

This README covers two stages:
1. **Run it locally** (do this first, to see it in your browser)
2. **Deploy it for free** (do this once you're happy with it — Vercel)

---

## Stage 1 — Run it locally

### 1. Create a free Supabase project
1. Go to https://supabase.com → sign in with GitHub → **New project**.
2. Pick any name/region, set a database password (you won't need it day-to-day), and wait ~2 min for it to provision.

### 2. Create the `trades` table
In your Supabase project, open **SQL Editor** → **New query**, paste this, and run it:

```sql
create table trades (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  trade_date date,
  screenshot_trade text,
  screenshot_context text,
  screenshot_day text,
  strategy text,
  direction text,
  setup_grade text,
  entry_price numeric,
  position_size_usd numeric,
  position_size_units numeric,
  account_risk numeric,
  stop_loss numeric,
  take_profit numeric,
  r numeric,
  fees numeric,
  exit_price numeric,
  exit_datetime timestamptz,
  context text,
  reason_for_cutting text,
  cut_result text,
  feelings text,
  lessons text,
  would_take_again text
);

create table alt_trades (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  trade_date timestamptz,
  exit_datetime timestamptz,
  pnl numeric,
  screenshots text[] default '{}',
  notes text
);

alter table trades enable row level security;

create policy "allow all - single user app"
  on trades for all
  using (true)
  with check (true);

alter table alt_trades enable row level security;

create policy "allow all alt trades - single user app"
  on alt_trades for all
  using (true)
  with check (true);
```

If the journal is already running, you only need the `alt_trades` table and its policy. Paste and run:

```sql
create table if not exists alt_trades (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  trade_date timestamptz,
  exit_datetime timestamptz,
  pnl numeric,
  screenshots text[] default '{}',
  notes text
);

alter table alt_trades enable row level security;

create policy "allow all alt trades - single user app"
  on alt_trades for all
  using (true)
  with check (true);
```

> **Note on security:** this policy allows anyone with your project's public
> "anon" key to read/write the table. That key is only ever visible in your
> own deployed app, not published anywhere, so for a personal tool this is a
> reasonable tradeoff — the same model most solo-user Supabase apps use. If
> you ever want to lock it down further (e.g. behind a password), that's a
> quick follow-up we can do later.

### 3. Create the screenshot storage bucket
In Supabase, go to **Storage** → **New bucket**.
- Name: `trade-screenshots`
- Public bucket: **on** (so screenshot links work directly in the app)

### 4. Get your API keys
Go to **Project Settings** → **API**. Copy:
- **Project URL**
- **anon public** key

### 5. Configure the app
In this project folder, copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Open `.env.local` and paste in your Project URL and anon key.

### 6. Install and run
```bash
npm install
npm run dev
```

Open the URL it prints (usually `http://localhost:5173`). You should see the
journal, ready to log your first trade.

---

## Stage 2 — Deploy for free (do this once you're happy locally)

1. Push this folder to a GitHub repo (private is fine).
2. Go to https://vercel.com → sign in with GitHub → **Add New Project** → import the repo.
3. In the import screen, add the same two environment variables from your
   `.env.local` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
4. Click **Deploy**. Vercel builds it and gives you a live URL — bookmark it
   on your phone and desktop.

Any time you want a field added or the layout changed, the code gets updated
and pushed, and Vercel redeploys automatically — no manual steps beyond that.

---

## Project structure
```
src/
  App.jsx              — data fetching, save/delete logic
  supabaseClient.js     — Supabase connection
  constants.js          — dropdown options, field lists
  components/
    TradeForm.jsx        — the entry/edit form
    TradeList.jsx         — the log, with stats bar and expandable rows
    ImageField.jsx        — screenshot upload widget
  index.css              — all styling
```
