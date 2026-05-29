create extension if not exists pgcrypto;

create table if not exists analysis_history (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sequence_preview text not null,
  payload jsonb not null
);

alter table analysis_history enable row level security;

create policy "user read own entries"
  on analysis_history for select
  using (auth.uid() = user_id);

create policy "user insert own entries"
  on analysis_history for insert
  with check (auth.uid() = user_id);
