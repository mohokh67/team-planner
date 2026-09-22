import { useEffect, useState } from "react";
import { createPlan } from "../domain/planStore";
import {
  createPlanRemote,
  deletePlan,
  fetchPlanNames,
  InvalidEditTokenError,
} from "../lib/persistence";
import {
  getCachedPlans,
  upsertCachedPlan,
  removeCachedPlan,
  type CachedPlanRef,
} from "../lib/localCache";

interface HomePageProps {
  onOpenPlan: (id: string, token: string | null) => void;
}

export function HomePage({ onOpenPlan }: HomePageProps) {
  const [plans, setPlans] = useState<CachedPlanRef[]>(getCachedPlans);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const ids = plans.map((p) => p.id);
    if (ids.length === 0) return;
    fetchPlanNames(ids)
      .then((rows) => {
        const nameById = new Map(rows.map((r) => [r.id, r.name]));
        setPlans((current) =>
          current.map((p) =>
            nameById.has(p.id) ? { ...p, name: nameById.get(p.id)! } : p,
          ),
        );
        for (const row of rows) {
          const cached = getCachedPlans().find((p) => p.id === row.id);
          if (cached) upsertCachedPlan({ ...cached, name: row.name });
        }
      })
      .catch(() => {
        // Offline or unreachable — keep showing the cached names.
      });
    // Only needs to run once per mount; the ids list is stable for that.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    setActionError(null);
    try {
      const plan = createPlan(name);
      await createPlanRemote(plan);
      upsertCachedPlan({ id: plan.id, editToken: plan.editToken, name: plan.name });
      onOpenPlan(plan.id, plan.editToken);
    } catch {
      setActionError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(ref: CachedPlanRef) {
    if (!window.confirm(`Delete "${ref.name}"? This can't be undone.`)) return;
    try {
      await deletePlan(ref.id, ref.editToken);
      removeCachedPlan(ref.id);
      setPlans((current) => current.filter((p) => p.id !== ref.id));
    } catch (err) {
      setActionError(
        err instanceof InvalidEditTokenError
          ? "Can't delete — this browser doesn't have that plan's edit link."
          : "Couldn't delete — check your connection and try again.",
      );
    }
  }

  return (
    <div className="page home-page">
      <h1>Team Planner</h1>

      <form className="new-plan-form" onSubmit={handleCreate}>
        <input
          className="row-input row-input-name"
          value={newName}
          placeholder="New plan name…"
          onChange={(e) => setNewName(e.target.value)}
        />
        <button type="submit" disabled={creating || !newName.trim()}>
          New plan
        </button>
      </form>

      {actionError && <p className="error-text">{actionError}</p>}

      {plans.length === 0 ? (
        <p className="muted">No plans yet. Create one above to get started.</p>
      ) : (
        <ul className="plan-list">
          {plans.map((ref) => (
            <li key={ref.id} className="plan-list-item">
              <button
                type="button"
                className="plan-list-open"
                onClick={() => onOpenPlan(ref.id, ref.editToken || null)}
              >
                {ref.name || "Untitled plan"}
              </button>
              <button
                type="button"
                className="row-remove"
                aria-label={`Delete ${ref.name}`}
                onClick={() => handleDelete(ref)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
