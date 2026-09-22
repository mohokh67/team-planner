import type { Person } from "../domain/planStore";

interface PersonRowProps {
  person: Person;
  unitLabel: string;
  readOnly: boolean;
  onUpdate: (patch: Partial<Pick<Person, "name" | "capacity">>) => void;
  onRemove: () => void;
}

export function PersonRow({
  person,
  unitLabel,
  readOnly,
  onUpdate,
  onRemove,
}: PersonRowProps) {
  return (
    <div className="row person-row">
      <input
        className="row-input row-input-name"
        value={person.name}
        placeholder="Name"
        disabled={readOnly}
        onChange={(e) => onUpdate({ name: e.target.value })}
      />
      <input
        className="row-input row-input-number"
        type="number"
        step="0.5"
        value={person.capacity}
        disabled={readOnly}
        onChange={(e) => onUpdate({ capacity: Number(e.target.value) })}
      />
      <span className="row-unit">{unitLabel}</span>
      {!readOnly && (
        <button
          type="button"
          className="row-remove"
          aria-label={`Remove ${person.name || "person"}`}
          onClick={onRemove}
        >
          ×
        </button>
      )}
    </div>
  );
}
