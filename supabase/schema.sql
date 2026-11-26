-- Tasdeeq / TrueNorth Postgres Schema (Supabase Free Tier)
create table if not exists public.vouchers (
  id text primary key,
  invoice_number text not null,
  vendor_name text not null,
  date text not null,
  total_amount numeric not null,
  category text default 'Miscellaneous',
  status text default 'verified',
  source text default 'web',
  entered_at timestamptz default now()
);

create table if not exists public.party_categories (
  party text primary key,
  category text not null,
  updated_at timestamptz default now()
);

create table if not exists public.owner_alerts (
  alert_id text primary key,
  invoice_number text not null,
  vendor_name text not null,
  total_amount numeric not null,
  discrepancy_summary text not null,
  status text default 'pending',
  created_at timestamptz default now(),
  action_timestamp timestamptz
);

create table if not exists public.closing_checklists (
  id text primary key,
  month_year text not null,
  checklist_items jsonb not null,
  closing_status text default 'needs_action',
  closing_certificate_hash text,
  closed_at timestamptz
);
