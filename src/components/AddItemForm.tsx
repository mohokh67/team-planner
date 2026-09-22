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
  const [label, setLabel] = useState("");
  const [estimate, setEstimate] = useState(0);

  return (
    <form
      className={className ? `row ${className}` : "row add-form"}
      onSubmit={(e) => {
        e.preventDefault();
        if (!label.trim()) return;
        onAdd(label.trim(), estimate);
        setLabel("");
        setEstimate(0);
      }}
    >
      <input
        className="row-input row-input-name"
        value={label}
        placeholder={namePlaceholder}
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
    </form>
  );
}
