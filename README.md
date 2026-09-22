# Team Planner

Single-page team capacity planning: set your team's available Capacity, list
the Tickets you want to commit to, and see how much fits. See `CONTEXT.md` for
the domain glossary and `docs/adr/` for the architectural decisions behind the
access model.

## Setup

1. `npm install`
2. Run `./scripts/setup-supabase.sh` — an interactive wizard that walks you
   through creating a Supabase project, running `supabase/schema.sql` (see
   below), and writing `.env.local`. Or do it by hand:
   - Create a Supabase project, then run `supabase/schema.sql` in its SQL
     editor. It creates the `plans` and `plan_secrets` tables with no direct
     access for anyone (no RLS policies at all), plus `get_plan` /
     `get_plan_names` / `create_plan` / `update_plan` / `delete_plan`
     functions that are the only way in — reads are scoped to the id(s)
     asked for, and writes check an edit token against `plan_secrets` first —
     see `docs/adr/0001-no-auth-persistence-model.md`.
   - Copy `.env.example` to `.env.local` and fill in your project's URL and
     anon key (Project Settings → API).
3. `npm run dev`

## Deploying to GitHub Pages

`.github/workflows/deploy.yml` builds and deploys `main` automatically. Before
the first push:

1. In the repo's Settings → Pages, set the source to "GitHub Actions".
2. In Settings → Secrets and variables → Actions, add `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY` as repository secrets — or answer yes at the last
   step of `./scripts/setup-supabase.sh`, which sets both via `gh`.

## Testing

`npm run test:e2e` runs the Playwright suite in `e2e/` against a real
headless browser. No Supabase project needed — `e2e/mockSupabase.ts`
intercepts every RPC call the app makes and answers it from an in-memory
store, so the suite is fully self-contained and fast. It starts its own dev
server automatically (see `playwright.config.ts`).

## Access model

There's no login. A Plan's URL carries both its UUID (read access) and a
separate edit token (write access) — see `docs/adr/0001-no-auth-persistence-model.md`.
Losing the edit token (e.g. clearing browser storage) makes that Plan
read-only until you open a link that still has it.
