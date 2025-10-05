interface QuestionDef {
  id: string;
  label: string;
  type: "text" | "textarea" | "radio" | "checkbox";
  options?: string[];
  placeholder?: string;
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
    return (
      <fieldset className="space-y-1">
        <legend className="text-sm font-medium">{def.label}</legend>
        <div className="flex flex-wrap gap-3 mt-1">
          {def.options?.map((opt) => (
            <label key={opt} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name={id}
                checked={value === opt}
                onChange={() => onChange(id, opt)}
              />
              {opt}
            </label>
          ))}
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
