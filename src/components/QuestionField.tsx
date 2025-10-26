import React, { useId } from "react";

interface QuestionDef {
  id: string;
  label: string;
  type: "text" | "textarea" | "radio" | "checkbox";
  options?: string[];
  placeholder?: string;
  freq?: boolean;
}

interface Props {
  def: QuestionDef;
  value: any;
  onChange: (id: string, value: any) => void;
  disabled?: boolean;
}

export function QuestionField({ def, value, onChange, disabled }: Props) {
  const id = def.id;

  if (def.type === "text") {
    return (
      <div className={disabled ? "opacity-50" : ""}>
        <label htmlFor={id} className="text-sm font-medium block mb-1">
          {def.label}
        </label>
        <input
          id={id}
          type="text"
          disabled={!!disabled}
          placeholder={def.placeholder || ""}
          value={value || ""}
          onChange={(e) => onChange(id, e.target.value)}
          className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring disabled:bg-gray-100"
        />
      </div>
    );
  }

  if (def.type === "textarea") {
    return (
      <div className={disabled ? "opacity-50" : ""}>
        <label htmlFor={id} className="text-sm font-medium block mb-1">
          {def.label}
        </label>
        <textarea
          id={id}
          rows={3}
          disabled={!!disabled}
          placeholder={def.placeholder || ""}
          value={value || ""}
          onChange={(e) => onChange(id, e.target.value)}
          className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring disabled:bg-gray-100"
        />
      </div>
    );
  }

  if (def.type === "radio") {
    const groupId = useId();

    const handleDoubleClick = (opt: string) => {
      if (disabled) return;
      if (value === opt) onChange(id, "");
    };

    return (
      <fieldset className={disabled ? "opacity-50" : ""}>
        <legend className="text-sm font-medium">{def.label}</legend>
        <div className="flex flex-col gap-2 mt-1">
          {def.options?.map((opt) => {
            const checked = value === opt;
            return (
              <label
                key={opt}
                className="inline-flex items-center gap-2 text-sm select-none"
                onDoubleClick={() => handleDoubleClick(opt)}
              >
                <input
                  type="radio"
                  name={`${id}__${groupId}`}
                  value={opt}
                  checked={checked}
                  disabled={!!disabled}
                  onChange={() => !disabled && onChange(id, opt)}
                />
                {opt}
              </label>
            );
          })}
        </div>
      </fieldset>
    );
  }

  if (def.type === "checkbox") {
    const arr = Array.isArray(value) ? value : [];
    const toggle = (opt: string) => {
      if (disabled) return;
      onChange(id, arr.includes(opt) ? arr.filter((x) => x !== opt) : [...arr, opt]);
    };

    return (
      <fieldset className={disabled ? "opacity-50" : ""}>
        <legend className="text-sm font-medium">{def.label}</legend>
        <div className="flex flex-wrap gap-3 mt-1">
          {def.options?.map((opt) => (
            <label key={opt} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={arr.includes(opt)}
                disabled={!!disabled}
                onChange={() => toggle(opt)}
              />
              {opt}
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  return null;
}
