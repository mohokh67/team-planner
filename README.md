# Team Planner

Single-page team capacity planning: set your team's available Capacity, list
the Tickets you want to commit to, and see how much fits. See `CONTEXT.md` for
the domain glossary and `docs/adr/` for the architectural decisions behind the
access model.

## Setup

1. `npm install`
2. Create a Supabase project, then run `supabase/schema.sql` in its SQL
   editor. It creates the `plans` and `plan_secrets` tables with no direct
   access for anyone (no RLS policies at all), plus `get_plan` /
   `get_plan_names` / `create_plan` / `update_plan` / `delete_plan`
   functions that are the only way in — reads are scoped to the id(s)
   asked for, and writes check an edit token against `plan_secrets` first —
   see `docs/adr/0001-no-auth-persistence-model.md`.
3. Copy `.env.example` to `.env.local` and fill in your project's URL and
   anon key (Project Settings → API).
4. `npm run dev`

## Deploying to GitHub Pages

`.github/workflows/deploy.yml` builds and deploys `main` automatically. Before
the first push:

1. In the repo's Settings → Pages, set the source to "GitHub Actions".
2. In Settings → Secrets and variables → Actions, add `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY` as repository secrets.

## Access model

There's no login. A Plan's URL carries both its UUID (read access) and a
separate edit token (write access) — see `docs/adr/0001-no-auth-persistence-model.md`.
Losing the edit token (e.g. clearing browser storage) makes that Plan
read-only until you open a link that still has it.
