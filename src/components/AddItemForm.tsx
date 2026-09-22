import { useState } from "react";

interface AddItemFormProps {
  namePlaceholder: string;
  unitLabel: string;
  className?: string;
  onAdd: (label: string, estimate: number) => void;
}

export function AddItemForm({
  namePlaceholder,
  unitLabel,
  className,
  onAdd,
}: AddItemFormProps) {
  const [expanded, setExpanded] = useState(false);
  const [label, setLabel] = useState("");
  const [estimate, setEstimate] = useState(0);

  function collapse() {
    setExpanded(false);
    setLabel("");
    setEstimate(0);
  }

  if (!expanded) {
    return (
      <button
        type="button"
        className="small-button add-trigger"
        onClick={() => setExpanded(true)}
      >
        + {namePlaceholder.replace(/…$/, "")}
      </button>
    );
  }

  return (
    <form
      className={className ? `row ${className}` : "row add-form"}
      onSubmit={(e) => {
        e.preventDefault();
        if (!label.trim()) return;
        onAdd(label.trim(), estimate);
        collapse();
      }}
    >
      <input
        className="row-input row-input-name"
        value={label}
        placeholder={namePlaceholder}
        autoFocus
        onChange={(e) => setLabel(e.target.value)}
      />
      <input
        className="row-input row-input-number"
        type="number"
        step="0.5"
        min="0"
        value={estimate}
        onChange={(e) => setEstimate(Number(e.target.value))}
      />
      <span className="row-unit">{unitLabel}</span>
      <button type="submit" className="small-button">
        Add
      </button>
      <button
        type="button"
        className="row-remove"
        aria-label="Cancel"
        onClick={collapse}
      >
        ×
      </button>
    </form>
  );
}
