import React, { useId } from "react";

interface QuestionDef {
  id: string;
  label: string;
  type: "text" | "textarea" | "radio" | "checkbox";
  options?: string[];
  placeholder?: string;
  /** Indique si la question appartient au tableau "fréquences" lors du submit */
  freq?: boolean;
}

interface Props {
  def: QuestionDef;
  value: any;
  onChange: (id: string, value: any) => void;
}

export function QuestionField({ def, value, onChange }: Props) {
  const id = def.id;

  if (def.type === "text") {
    return (
      <div>
        <label htmlFor={id} className="text-sm font-medium block mb-1">
          {def.label}
        </label>
        <input
          id={id}
          type="text"
          placeholder={def.placeholder || ""}
          value={value || ""}
          onChange={(e) => onChange(id, e.target.value)}
          className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring"
        />
      </div>
    );
  }

  if (def.type === "textarea") {
    return (
      <div>
        <label htmlFor={id} className="text-sm font-medium block mb-1">
          {def.label}
        </label>
        <textarea
          id={id}
          rows={3}
          placeholder={def.placeholder || ""}
          value={value || ""}
          onChange={(e) => onChange(id, e.target.value)}
          className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring"
        />
      </div>
    );
  }

  if (def.type === "radio") {
    // 1) name unique par composant (évite les collisions quand 2 vues coexistent)
    const groupId = useId();

    // 2) permet de déselectionner au double-clic
    const handleDoubleClick = (opt: string) => {
      if (value === opt) {
        onChange(id, "");
      }
    };

    return (
      <fieldset className="space-y-1">
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
                  name={`${id}__${groupId}`} // <- unique
                  value={opt}
                  checked={checked}
                  onChange={() => onChange(id, opt)}
                  // si on reclique sur la même option (simple clic), on laisse le comportement standard
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
    const toggle = (opt: string) =>
      onChange(
        id,
        arr.includes(opt) ? arr.filter((x) => x !== opt) : [...arr, opt]
      );

    return (
      <fieldset className="space-y-1">
        <legend className="text-sm font-medium">{def.label}</legend>
        <div className="flex flex-wrap gap-3 mt-1">
          {def.options?.map((opt) => (
            <label key={opt} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={arr.includes(opt)}
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
