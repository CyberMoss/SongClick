import { useEffect, useRef, useState } from "react";

interface NumberControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  inputMode?: "numeric" | "decimal";
  onChange: (value: number) => void;
}

export function NumberControl({
  label,
  value,
  min,
  max,
  step = 1,
  inputMode = label.toUpperCase().includes("BPM") ? "decimal" : "numeric",
  onChange,
}: NumberControlProps) {
  const resolvedInputMode = inputMode;
  const [draft, setDraft] = useState(String(value));
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEditing) {
      setDraft(String(value));
    }
  }, [isEditing, value]);

  function commitDraft() {
    setIsEditing(false);
    const nextValue = Number(draft);
    if (!draft.trim() || Number.isNaN(nextValue)) {
      setDraft(String(value));
      return;
    }
    onChange(nextValue);
  }

  function stepValue(delta: number) {
    const decimals = String(step).split(".")[1]?.length ?? 0;
    const nextValue = value + delta;
    setIsEditing(false);
    onChange(decimals > 0 ? Number(nextValue.toFixed(decimals)) : nextValue);
  }

  function updateDraft(nextDraft: string) {
    const isValidDraft =
      resolvedInputMode === "decimal" ? /^\d*\.?\d*$/.test(nextDraft) : /^\d*$/.test(nextDraft);

    if (isValidDraft) {
      setDraft(nextDraft);
    }
  }

  return (
    <div className="number-control">
      <label>{label}</label>
      <div className="number-row">
        <input
          ref={inputRef}
          type="text"
          inputMode={resolvedInputMode}
          pattern={resolvedInputMode === "decimal" ? "[0-9]*[.]?[0-9]*" : "[0-9]*"}
          value={isEditing ? draft : value}
          onFocus={(event) => {
            setIsEditing(true);
            setDraft(String(value));
            event.currentTarget.select();
          }}
          onChange={(event) => updateDraft(event.target.value)}
          onBlur={commitDraft}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              inputRef.current?.blur();
            }
            if (event.key === "Escape") {
              setIsEditing(false);
              setDraft(String(value));
              inputRef.current?.blur();
            }
          }}
        />
        <div className="stepper-buttons">
          <button type="button" aria-label={`${label}增加`} onClick={() => stepValue(step)}>
            ▲
          </button>
          <button type="button" aria-label={`${label}减少`} onClick={() => stepValue(-step)}>
            ▼
          </button>
        </div>
      </div>
    </div>
  );
}
