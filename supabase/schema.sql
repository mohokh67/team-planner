-- Team Planner schema. Run this in the Supabase SQL editor for a fresh project.
--
-- Access model is documented in docs/adr/0001-no-auth-persistence-model.md:
-- there is no authentication, so a Plan's UUID is its read key and a
-- separate edit token is its write key. Neither can be enforced by an RLS
-- predicate alone — `using (true)` grants a whole table to a role, not to
-- "callers who supplied a matching id," so anon gets NO direct policies on
-- either table. Every read and every write goes through a security-definer
-- function that takes the id (and, for writes, the token) as a typed
-- parameter and checks it explicitly, instead of relying on RLS to filter
-- rows it fundamentally can't distinguish by caller knowledge.

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

-- No RLS policies at all for anon on either table: both are unreadable and
-- unwritable directly, by default-deny. A `using (true)` policy would look
-- like "anyone who knows the id," but RLS has no notion of "the id the
-- caller supplied" — it would actually grant every row to anon, which is
-- exactly the bug this schema fixes (see docs/adr/0001, "Considered and
-- rejected"). Only the security-definer functions below (running as their
-- owner, bypassing RLS) can touch these tables.

drop policy if exists "anon can read plans" on plans;

create or replace function get_plan(p_id uuid)
returns table (
  id uuid,
  name text,
  unit_label text,
  people jsonb,
  tickets jsonb
)
language sql
security definer
set search_path = public
stable
as $$
  select id, name, unit_label, people, tickets
  from plans
  where id = p_id;
$$;

create or replace function get_plan_names(p_ids uuid[])
returns table (id uuid, name text)
language sql
security definer
set search_path = public
stable
as $$
  select id, name from plans where id = any(p_ids);
$$;

create or replace function create_plan(p_id uuid, p_name text, p_edit_token text)
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

create or replace function update_plan(
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

create or replace function delete_plan(p_id uuid, p_token text)
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

revoke execute on function get_plan(uuid) from public;
revoke execute on function get_plan_names(uuid[]) from public;
revoke execute on function create_plan(uuid, text, text) from public;
revoke execute on function update_plan(uuid, text, text, text, jsonb, jsonb) from public;
revoke execute on function delete_plan(uuid, text) from public;
grant execute on function get_plan(uuid) to anon;
grant execute on function get_plan_names(uuid[]) to anon;
grant execute on function create_plan(uuid, text, text) to anon;
grant execute on function update_plan(uuid, text, text, text, jsonb, jsonb) to anon;
grant execute on function delete_plan(uuid, text) to anon;
