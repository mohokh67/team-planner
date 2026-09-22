import { supabase } from "./supabase";
import type { Plan } from "../domain/planStore";

interface PlanRow {
  id: string;
  name: string;
  unit_label: string;
  edit_token: string;
  people: Plan["people"];
  tickets: Plan["tickets"];
}

function rowToPlan(row: PlanRow): Plan {
  return {
    id: row.id,
    name: row.name,
    unitLabel: row.unit_label,
    editToken: row.edit_token,
    people: row.people,
    tickets: row.tickets,
  };
}

function planToRow(plan: Plan): PlanRow {
  return {
    id: plan.id,
    name: plan.name,
    unit_label: plan.unitLabel,
    edit_token: plan.editToken,
    people: plan.people,
    tickets: plan.tickets,
  };
}

export async function fetchPlan(id: string): Promise<Plan | null> {
  const { data, error } = await supabase
    .from("plans")
    .select("id, name, unit_label, edit_token, people, tickets")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToPlan(data as PlanRow) : null;
}

export async function upsertPlan(plan: Plan): Promise<void> {
  const { error } = await supabase
    .from("plans")
    .upsert({ ...planToRow(plan), updated_at: new Date().toISOString() });
  if (error) throw error;
}

export async function deletePlan(id: string): Promise<void> {
  const { error } = await supabase.from("plans").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchPlanNames(
  ids: string[],
): Promise<Array<{ id: string; name: string }>> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from("plans")
    .select("id, name")
    .in("id", ids);
  if (error) throw error;
  return data ?? [];
}
