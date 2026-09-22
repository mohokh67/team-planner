import { supabase } from "./supabase";
import type { Plan } from "../domain/planStore";

// The edit token is never selected from `plans` — it lives in a separate
// table anon can't read at all (see supabase/schema.sql). A plan fetched
// from the server has no editToken; the caller merges in whatever token
// came from the URL/local cache, and every write is verified server-side
// against the real one via the RPCs below.
export type PublicPlan = Omit<Plan, "editToken">;

interface PlanRow {
  id: string;
  name: string;
  unit_label: string;
  people: Plan["people"];
  tickets: Plan["tickets"];
}

function rowToPlan(row: PlanRow): PublicPlan {
  return {
    id: row.id,
    name: row.name,
    unitLabel: row.unit_label,
    people: row.people,
    tickets: row.tickets,
  };
}

export class InvalidEditTokenError extends Error {
  constructor() {
    super("Edit token was rejected by the server");
    this.name = "InvalidEditTokenError";
  }
}

export async function fetchPlan(id: string): Promise<PublicPlan | null> {
  const { data, error } = await supabase.rpc("get_plan", { p_id: id });
  if (error) throw error;
  const row = (data as PlanRow[] | null)?.[0];
  return row ? rowToPlan(row) : null;
}

export async function createPlanRemote(plan: Plan): Promise<void> {
  const { error } = await supabase.rpc("create_plan", {
    p_id: plan.id,
    p_name: plan.name,
    p_edit_token: plan.editToken,
  });
  if (error) throw error;
}

/** Throws InvalidEditTokenError if the token doesn't match the plan's. */
export async function updatePlanRemote(plan: Plan): Promise<void> {
  const { data, error } = await supabase.rpc("update_plan", {
    p_id: plan.id,
    p_token: plan.editToken,
    p_name: plan.name,
    p_unit_label: plan.unitLabel,
    p_people: plan.people,
    p_tickets: plan.tickets,
  });
  if (error) throw error;
  if (!data) throw new InvalidEditTokenError();
}

/** Throws InvalidEditTokenError if the token doesn't match the plan's. */
export async function deletePlan(id: string, editToken: string): Promise<void> {
  const { data, error } = await supabase.rpc("delete_plan", {
    p_id: id,
    p_token: editToken,
  });
  if (error) throw error;
  if (!data) throw new InvalidEditTokenError();
}

export async function fetchPlanNames(
  ids: string[],
): Promise<Array<{ id: string; name: string }>> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase.rpc("get_plan_names", { p_ids: ids });
  if (error) throw error;
  return data ?? [];
}
