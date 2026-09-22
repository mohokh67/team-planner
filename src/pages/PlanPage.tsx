import { useEffect, useMemo, useState } from "react";
import {
  addPerson,
  addSubtask,
  addTicket,
  leafItems,
  overflow,
  percentOfCapacity,
  remaining,
  removePerson,
  removeSubtask,
  removeTicket,
  renamePlan,
  setColor,
  setUnitLabel,
  toggleChecked,
  totalAllocated,
  totalCapacity,
  updatePerson,
  updateSubtask,
  updateTicket,
  type Plan,
} from "../domain/planStore";
import { fetchPlan, updatePlanRemote, InvalidEditTokenError } from "../lib/persistence";
import { upsertCachedPlan } from "../lib/localCache";
import { debounce } from "../lib/debounce";
import { AddItemForm } from "../components/AddItemForm";
import { DonutChart } from "../components/DonutChart";
import { PersonRow } from "../components/PersonRow";
import { TicketRow } from "../components/TicketRow";

interface PlanPageProps {
  id: string;
  token: string | null;
  onHome: () => void;
}

export function PlanPage({ id, token, onHome }: PlanPageProps) {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "not-found" | "error">(
    "loading",
  );
  // Optimistic: a token in the URL is assumed valid until the server says
  // otherwise. The server never tells us the real edit_token (it can't be
  // read by anon at all — see supabase/schema.sql), so this can only be
  // confirmed or rejected by an actual write, never verified up front.
  const [editAllowed, setEditAllowed] = useState(Boolean(token));
  const [saveFailed, setSaveFailed] = useState(false);

  function saveToServer(next: Plan) {
    updatePlanRemote(next)
      .then(() => setSaveFailed(false))
      .catch((err) => {
        if (err instanceof InvalidEditTokenError) {
          // The link's token is wrong — this was never really ours to
          // edit, so stop pretending and drop to read-only.
          setEditAllowed(false);
          return;
        }
        // The edit is still safe in local React state; surface the
        // failure so the user knows a refresh could lose it. Cleared
        // either by the next successful autosave, or a manual retry.
        setSaveFailed(true);
      });
  }

  const debouncedSave = useMemo(() => debounce(saveToServer, 1000), []);

  useEffect(() => {
    let cancelled = false;
    fetchPlan(id)
      .then((loaded) => {
        if (cancelled) return;
        if (!loaded) {
          setStatus("not-found");
          return;
        }
        setPlan({ ...loaded, editToken: token ?? "" });
        setStatus("ready");
        if (token) {
          upsertCachedPlan({ id: loaded.id, name: loaded.name, editToken: token });
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
    // id+token are also the component's key in App.tsx, so this only ever
    // runs once per mount, but list both since they're both read above.
  }, [id, token]);

  function update(next: Plan) {
    setPlan(next);
    debouncedSave(next);
  }

  if (status === "loading") {
    return (
      <div className="page">
        <p className="muted">Loading…</p>
      </div>
    );
  }

  if (status === "not-found" || !plan) {
    return (
      <div className="page">
        <p>This plan doesn't exist (or was deleted).</p>
        <button type="button" onClick={onHome}>
          ← All plans
        </button>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="page">
        <p>Couldn't reach the server. Check your connection and reload.</p>
        <button type="button" onClick={onHome}>
          ← All plans
        </button>
      </div>
    );
  }

  const capacity = totalCapacity(plan);
  const allocated = totalAllocated(plan);
  const left = remaining(plan);
  const isOverCapacity = overflow(plan) > 0;
  const percentFor = (estimate: number) => percentOfCapacity(plan, estimate);
  const checkedLeaves = leafItems(plan).filter((i) => i.checked);

  return (
    <div className="page plan-page">
      <div className="plan-header">
        <button type="button" className="link-button" onClick={onHome}>
          ← All plans
        </button>
        {!editAllowed && (
          <span className="read-only-badge">Read-only (no edit link)</span>
        )}
        {editAllowed && saveFailed && (
          <button
            type="button"
            className="save-failed-badge"
            onClick={() => saveToServer(plan)}
          >
            Couldn't save — click to retry
          </button>
        )}
      </div>

      <div className="plan-title-row">
        <input
          className="plan-name-input"
          value={plan.name}
          disabled={!editAllowed}
          onChange={(e) => update(renamePlan(plan, e.target.value))}
        />
        <label className="unit-label-field">
          Unit
          <input
            className="row-input"
            value={plan.unitLabel}
            placeholder="days, story points…"
            disabled={!editAllowed}
            onChange={(e) => update(setUnitLabel(plan, e.target.value))}
          />
        </label>
      </div>

      <div className="plan-summary">
        <DonutChart
          capacity={capacity}
          allocated={allocated}
          unitLabel={plan.unitLabel}
          slices={checkedLeaves.map((i) => ({
            id: i.subtaskId ?? i.ticketId,
            label: i.label,
            estimate: i.estimate,
            color: i.color,
          }))}
        />
        <div className="plan-summary-numbers">
          <div>
            <strong>{capacity}</strong> {plan.unitLabel} capacity
          </div>
          <div>
            <strong>{allocated}</strong> {plan.unitLabel} allocated
          </div>
          <div className={isOverCapacity ? "overflow-text" : ""}>
            <strong>{left}</strong> {plan.unitLabel} {isOverCapacity ? "over" : "left"}
          </div>
        </div>
      </div>

      <div className="plan-columns">
        <section className="plan-column">
          <h2>Team</h2>
          {plan.people.length > 0 && (
            <div className="row person-row-header">
              <span className="row-input-name" />
              <span className="row-header-label">Capacity</span>
              <span className="row-op" />
              <span className="row-header-label">Unavailable</span>
              <span className="row-op" />
              <span className="row-header-label">Net</span>
            </div>
          )}
          {plan.people.map((person) => (
            <PersonRow
              key={person.id}
              person={person}
              unitLabel={plan.unitLabel}
              readOnly={!editAllowed}
              onUpdate={(patch) => update(updatePerson(plan, person.id, patch))}
              onRemove={() => update(removePerson(plan, person.id))}
            />
          ))}
          {editAllowed && (
            <AddItemForm
              namePlaceholder="Add person…"
              unitLabel={plan.unitLabel}
              onAdd={(name, capacity) => update(addPerson(plan, name, capacity))}
            />
          )}
        </section>

        <section className="plan-column">
          <h2>Tickets</h2>
          {plan.tickets.map((ticket) => (
            <TicketRow
              key={ticket.id}
              ticket={ticket}
              unitLabel={plan.unitLabel}
              readOnly={!editAllowed}
              percentOfCapacity={percentFor}
              onToggleTicket={() =>
                update(toggleChecked(plan, { ticketId: ticket.id }))
              }
              onToggleSubtask={(subtaskId) =>
                update(toggleChecked(plan, { ticketId: ticket.id, subtaskId }))
              }
              onUpdateTicket={(patch) =>
                update(updateTicket(plan, ticket.id, patch))
              }
              onSetColor={(color) =>
                update(setColor(plan, { ticketId: ticket.id }, color))
              }
              onRemoveTicket={() => update(removeTicket(plan, ticket.id))}
              onAddSubtask={(label, estimate) =>
                update(addSubtask(plan, ticket.id, label, estimate))
              }
              onUpdateSubtask={(subtaskId, patch) =>
                update(updateSubtask(plan, ticket.id, subtaskId, patch))
              }
              onRemoveSubtask={(subtaskId) =>
                update(removeSubtask(plan, ticket.id, subtaskId))
              }
            />
          ))}
          {editAllowed && (
            <AddItemForm
              namePlaceholder="Add ticket…"
              unitLabel={plan.unitLabel}
              onAdd={(label, estimate) => update(addTicket(plan, label, estimate))}
            />
          )}
        </section>
      </div>
    </div>
  );
}
