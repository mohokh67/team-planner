// Home-page plan list cache. Read key = id, write access needs editToken too.
// This is the *only* place the home page's list comes from — there is no
// "list all plans" query against Supabase (see docs/adr/0001).

const STORAGE_KEY = "team-planner:plans";

export interface CachedPlanRef {
  id: string;
  editToken: string;
  name: string;
}

export function getCachedPlans(): CachedPlanRef[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CachedPlanRef[]) : [];
  } catch {
    return [];
  }
}

function saveCachedPlans(list: CachedPlanRef[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Storage unavailable (private mode, quota, etc.) — cache is best-effort.
  }
}

export function upsertCachedPlan(ref: CachedPlanRef): void {
  const list = getCachedPlans();
  const existing = list.findIndex((p) => p.id === ref.id);
  if (existing >= 0) {
    list[existing] = { ...list[existing], ...ref };
  } else {
    list.push(ref);
  }
  saveCachedPlans(list);
}

export function removeCachedPlan(id: string): void {
  saveCachedPlans(getCachedPlans().filter((p) => p.id !== id));
}
