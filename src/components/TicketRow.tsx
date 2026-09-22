import { useEffect, useRef } from "react";
import {
  isLeafTicket,
  parentCheckState,
  type Subtask,
  type Ticket,
} from "../domain/planStore";
import { AddItemForm } from "./AddItemForm";
import { MiniPercent } from "./MiniPercent";
import { SubtaskRow } from "./SubtaskRow";

interface TicketRowProps {
  ticket: Ticket;
  unitLabel: string;
  readOnly: boolean;
  percentOfCapacity: (estimate: number) => number;
  onToggleTicket: () => void;
  onToggleSubtask: (subtaskId: string) => void;
  onUpdateTicket: (
    patch: Partial<Pick<Ticket, "label" | "type" | "estimate">>,
  ) => void;
  onSetColor: (color: string) => void;
  onRemoveTicket: () => void;
  onAddSubtask: (label: string, estimate: number) => void;
  onUpdateSubtask: (
    subtaskId: string,
    patch: Partial<Pick<Subtask, "label" | "estimate" | "color">>,
  ) => void;
  onRemoveSubtask: (subtaskId: string) => void;
}

export function TicketRow({
  ticket,
  unitLabel,
  readOnly,
  percentOfCapacity,
  onToggleTicket,
  onToggleSubtask,
  onUpdateTicket,
  onSetColor,
  onRemoveTicket,
  onAddSubtask,
  onUpdateSubtask,
  onRemoveSubtask,
}: TicketRowProps) {
  const leaf = isLeafTicket(ticket);
  const checkboxRef = useRef<HTMLInputElement>(null);

  const state = parentCheckState(ticket);
  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = state === "indeterminate";
    }
  }, [state]);

  return (
    <div className="ticket">
      <div className="row ticket-row">
        <input
          ref={checkboxRef}
          type="checkbox"
          checked={leaf ? ticket.checked : state === "checked"}
          disabled={readOnly}
          onChange={onToggleTicket}
        />
        {leaf && (
          <MiniPercent
            percent={percentOfCapacity(ticket.estimate)}
            color={ticket.color}
          />
        )}
        <input
          className="row-input row-input-name"
          value={ticket.label}
          placeholder="Ticket"
          disabled={readOnly}
          onChange={(e) => onUpdateTicket({ label: e.target.value })}
        />
        <input
          className="row-input row-input-type"
          value={ticket.type}
          placeholder="Type (optional)"
          disabled={readOnly}
          onChange={(e) => onUpdateTicket({ type: e.target.value })}
        />
        {leaf && (
          <>
            <input
              className="row-input row-input-number"
              type="number"
              step="0.5"
              min="0"
              value={ticket.estimate}
              disabled={readOnly}
              onChange={(e) =>
                onUpdateTicket({ estimate: Number(e.target.value) })
              }
            />
            <span className="row-unit">{unitLabel}</span>
            <input
              type="color"
              className="color-input"
              value={ticket.color}
              disabled={readOnly}
              onChange={(e) => onSetColor(e.target.value)}
            />
          </>
        )}
        {!readOnly && (
          <button
            type="button"
            className="row-remove"
            aria-label={`Remove ${ticket.label || "ticket"}`}
            onClick={onRemoveTicket}
          >
            ×
          </button>
        )}
      </div>

      <div className="subtasks">
        {ticket.subtasks.map((subtask) => (
          <SubtaskRow
            key={subtask.id}
            subtask={subtask}
            unitLabel={unitLabel}
            percent={percentOfCapacity(subtask.estimate)}
            readOnly={readOnly}
            onToggle={() => onToggleSubtask(subtask.id)}
            onUpdate={(patch) => onUpdateSubtask(subtask.id, patch)}
            onRemove={() => onRemoveSubtask(subtask.id)}
          />
        ))}
        {!readOnly && (
          <AddItemForm
            namePlaceholder="Add subtask…"
            unitLabel={unitLabel}
            className="add-subtask-form"
            onAdd={onAddSubtask}
          />
        )}
      </div>
    </div>
  );
}
