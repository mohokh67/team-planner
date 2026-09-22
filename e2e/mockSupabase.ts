import type { Page } from "@playwright/test";

interface PlanRow {
  id: string;
  name: string;
  unit_label: string;
  people: unknown[];
  tickets: unknown[];
}

/**
 * Stands in for a Supabase project: intercepts every RPC call the app
 * makes (see src/lib/persistence.ts - it never calls `.from()` directly,
 * only `.rpc()`) and answers them against an in-memory store, mirroring
 * the behavior of the real functions in supabase/schema.sql. Lets the
 * whole app be exercised in a real browser with no live backend, no
 * secrets, and fully deterministic state per test.
 */
export async function installSupabaseMock(page: Page) {
  const plans = new Map<string, PlanRow>();
  const secrets = new Map<string, string>(); // plan id -> edit token

  await page.route("**/rest/v1/rpc/**", async (route) => {
    const url = new URL(route.request().url());
    const fn = url.pathname.split("/").pop();
    const params = route.request().postDataJSON() as Record<string, unknown>;

    switch (fn) {
      case "create_plan": {
        const id = params.p_id as string;
        plans.set(id, {
          id,
          name: params.p_name as string,
          unit_label: "",
          people: [],
          tickets: [],
        });
        secrets.set(id, params.p_edit_token as string);
        return route.fulfill({ status: 200, contentType: "application/json", body: "null" });
      }
      case "get_plan": {
        const row = plans.get(params.p_id as string);
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(row ? [row] : []),
        });
      }
      case "get_plan_names": {
        const ids = params.p_ids as string[];
        const rows = ids
          .map((id) => plans.get(id))
          .filter((r): r is PlanRow => Boolean(r))
          .map((r) => ({ id: r.id, name: r.name }));
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(rows) });
      }
      case "update_plan": {
        const id = params.p_id as string;
        const ok = plans.has(id) && secrets.get(id) === params.p_token;
        if (ok) {
          plans.set(id, {
            id,
            name: params.p_name as string,
            unit_label: params.p_unit_label as string,
            people: params.p_people as unknown[],
            tickets: params.p_tickets as unknown[],
          });
        }
        return route.fulfill({ status: 200, contentType: "application/json", body: String(ok) });
      }
      case "delete_plan": {
        const id = params.p_id as string;
        const ok = plans.has(id) && secrets.get(id) === params.p_token;
        if (ok) {
          plans.delete(id);
          secrets.delete(id);
        }
        return route.fulfill({ status: 200, contentType: "application/json", body: String(ok) });
      }
      default:
        return route.fulfill({ status: 404, contentType: "application/json", body: "null" });
    }
  });

  return { plans, secrets };
}
