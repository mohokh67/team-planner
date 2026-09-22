import type { Subtask } from "../domain/planStore";
import { MiniPercent } from "./MiniPercent";

interface SubtaskRowProps {
  subtask: Subtask;
  unitLabel: string;
  percent: number;
  readOnly: boolean;
  onToggle: () => void;
  onUpdate: (patch: Partial<Pick<Subtask, "label" | "estimate" | "color">>) => void;
  onRemove: () => void;
}

export function SubtaskRow({
  subtask,
  unitLabel,
  percent,
  readOnly,
  onToggle,
  onUpdate,
  onRemove,
}: SubtaskRowProps) {
  return (
    <div className="row subtask-row">
      <input
        type="checkbox"
        checked={subtask.checked}
        disabled={readOnly}
        onChange={onToggle}
      />
      <MiniPercent percent={percent} color={subtask.color} />
      <input
        className="row-input row-input-name"
        value={subtask.label}
        placeholder="Subtask"
        disabled={readOnly}
        onChange={(e) => onUpdate({ label: e.target.value })}
      />
      <input
        className="row-input row-input-number"
        type="number"
        step="0.5"
        value={subtask.estimate}
        disabled={readOnly}
        onChange={(e) => onUpdate({ estimate: Number(e.target.value) })}
      />
      <span className="row-unit">{unitLabel}</span>
      <input
        type="color"
        className="color-input"
        value={subtask.color}
        disabled={readOnly}
        onChange={(e) => onUpdate({ color: e.target.value })}
      />
      {!readOnly && (
        <button
          type="button"
          className="row-remove"
          aria-label={`Remove ${subtask.label || "subtask"}`}
          onClick={onRemove}
        >
          ×
        </button>
      )}
    </div>
  );
}
