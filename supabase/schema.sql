-- Team Planner schema. Run this in the Supabase SQL editor for a fresh project.
--
-- Access model is documented in docs/adr/0001-no-auth-persistence-model.md:
-- there is no authentication, so RLS is left open for the anon role and all
-- access control (read key / edit token) is enforced by the application.

create table if not exists plans (
  id uuid primary key,
  name text not null default '',
  unit_label text not null default '',
  edit_token text not null,
  people jsonb not null default '[]'::jsonb,
  tickets jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table plans enable row level security;

create policy "anon can read plans"
  on plans for select
  to anon
  using (true);

create policy "anon can insert plans"
  on plans for insert
  to anon
  with check (true);

create policy "anon can update plans"
  on plans for update
  to anon
  using (true)
  with check (true);

create policy "anon can delete plans"
  on plans for delete
  to anon
  using (true);
