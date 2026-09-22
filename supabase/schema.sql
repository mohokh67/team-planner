-- Team Planner schema. Run this in the Supabase SQL editor for a fresh project.
--
-- Access model is documented in docs/adr/0001-no-auth-persistence-model.md:
-- there is no authentication, so a Plan's UUID is its read key and a
-- separate edit token is its write key. The edit token must never be
-- readable by the anon role (that would collapse read access into write
-- access for anyone who merely knows a Plan's UUID) — it lives in its own
-- table with no anon policies at all, and every write is checked against
-- it inside a security-definer function instead of a table RLS policy.

create table if not exists plans (
  id uuid primary key,
  name text not null default '',
  unit_label text not null default '',
  people jsonb not null default '[]'::jsonb,
  tickets jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists plan_secrets (
  plan_id uuid primary key references plans (id) on delete cascade,
  edit_token text not null
);

alter table plans enable row level security;
alter table plan_secrets enable row level security;

-- Anyone holding a Plan's UUID can read its (non-secret) data.
create policy "anon can read plans"
  on plans for select
  to anon
  using (true);

-- No policies at all on plan_secrets for anon: it is unreadable and
-- unwritable directly, by default-deny. Only the functions below (running
-- as their owner, not as anon) can touch it.

create function create_plan(p_id uuid, p_name text, p_edit_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into plans (id, name) values (p_id, p_name);
  insert into plan_secrets (plan_id, edit_token) values (p_id, p_edit_token);
end;
$$;

create function update_plan(
  p_id uuid,
  p_token text,
  p_name text,
  p_unit_label text,
  p_people jsonb,
  p_tickets jsonb
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from plan_secrets
    where plan_id = p_id and edit_token = p_token
  ) then
    return false;
  end if;

  update plans
  set name = p_name,
      unit_label = p_unit_label,
      people = p_people,
      tickets = p_tickets,
      updated_at = now()
  where id = p_id;

  return true;
end;
$$;

create function delete_plan(p_id uuid, p_token text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from plan_secrets
    where plan_id = p_id and edit_token = p_token
  ) then
    return false;
  end if;

  delete from plans where id = p_id; -- cascades to plan_secrets
  return true;
end;
$$;

revoke execute on function create_plan(uuid, text, text) from public;
revoke execute on function update_plan(uuid, text, text, text, jsonb, jsonb) from public;
revoke execute on function delete_plan(uuid, text) from public;
grant execute on function create_plan(uuid, text, text) to anon;
grant execute on function update_plan(uuid, text, text, text, jsonb, jsonb) to anon;
grant execute on function delete_plan(uuid, text) to anon;
