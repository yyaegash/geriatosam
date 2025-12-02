import React, { useId, useState } from "react";

// Helper pour convertir les | en retours à la ligne pour les tooltips
function formatTooltip(tooltip?: string): string | undefined {
  if (!tooltip) return undefined;
  return tooltip.replace(/\|/g, '\n');
}

// Hook personnalisé pour gérer l'état et les interactions des tooltips
function useTooltip() {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleTouch = () => setShowTooltip(!showTooltip);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowTooltip(!showTooltip);
  };

  const closeTooltip = () => setShowTooltip(false);

  return { showTooltip, handleTouch, handleClick, closeTooltip };
}

// Composant de tooltip réutilisable
function TooltipContent({
  tooltip,
  showTooltip,
  onTouch,
  onClick,
  onClose
}: {
  tooltip: string;
  showTooltip: boolean;
  onTouch: () => void;
  onClick: (e: React.MouseEvent) => void;
  onClose: () => void;
}) {
  return (
    <>
      <span
        className="ml-1 text-blue-500 text-xs select-none"
        onTouchStart={onTouch}
        onClick={onClick}
      >
        ⓘ
      </span>
      <div className={`absolute left-0 top-full mt-1 p-3 bg-gray-800 text-white text-xs rounded shadow-lg transition-all duration-200 z-50 whitespace-pre-line w-72 sm:w-80 md:w-96 lg:w-[32rem] ${
        showTooltip ? 'opacity-100 visible' : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible'
      }`}>
        {tooltip}
      </div>
      {/* Overlay pour fermer le tooltip sur mobile */}
      {showTooltip && (
        <div
          className="fixed inset-0 z-40"
          onClick={onClose}
          onTouchStart={onClose}
        />
      )}
    </>
  );
}

// Composant pour afficher un label avec tooltip optionnel
function LabelWithTooltip({
  htmlFor,
  className,
  tooltip,
  children
}: {
  htmlFor?: string;
  className?: string;
  tooltip?: string;
  children: React.ReactNode;
}) {
  const formattedTooltip = formatTooltip(tooltip);
  const { showTooltip, handleTouch, handleClick, closeTooltip } = useTooltip();

  if (!formattedTooltip) {
    return <label htmlFor={htmlFor} className={className}>{children}</label>;
  }

  return (
    <label htmlFor={htmlFor} className={`${className} relative group cursor-help`}>
      {children}
      <TooltipContent
        tooltip={formattedTooltip}
        showTooltip={showTooltip}
        onTouch={handleTouch}
        onClick={handleClick}
        onClose={closeTooltip}
      />
    </label>
  );
}

// Composant pour afficher une legend avec tooltip optionnel
function LegendWithTooltip({
  className,
  tooltip,
  children
}: {
  className?: string;
  tooltip?: string;
  children: React.ReactNode;
}) {
  const formattedTooltip = formatTooltip(tooltip);
  const { showTooltip, handleTouch, handleClick, closeTooltip } = useTooltip();

  if (!formattedTooltip) {
    return <legend className={className}>{children}</legend>;
  }

  return (
    <legend className={`${className} relative group cursor-help`}>
      {children}
      <TooltipContent
        tooltip={formattedTooltip}
        showTooltip={showTooltip}
        onTouch={handleTouch}
        onClick={handleClick}
        onClose={closeTooltip}
      />
    </legend>
  );
}

interface QuestionDef {
  id: string;
  label: string;
  type: "text" | "textarea" | "radio" | "checkbox" | "information";
  options?: string[];
  placeholder?: string;
  freq?: boolean;
  tooltip?: string;
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
        <LabelWithTooltip
          htmlFor={id}
          className="text-sm font-medium block mb-1"
          tooltip={def.tooltip}
        >
          {def.label}
        </LabelWithTooltip>
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
        <LabelWithTooltip
          htmlFor={id}
          className="text-sm font-medium block mb-1"
          tooltip={def.tooltip}
        >
          {def.label}
        </LabelWithTooltip>
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
    const [lastTap, setLastTap] = useState<{ opt: string; time: number } | null>(null);

    const handleTouch = (opt: string) => {
      if (disabled) return;

      const now = Date.now();
      const isDoubleTap = lastTap && lastTap.opt === opt && (now - lastTap.time) < 500;

      if (isDoubleTap && value === opt) {
        // Double tap sur l'option déjà sélectionnée -> décocher
        onChange(id, "");
        setLastTap(null);
      } else {
        // Simple tap -> sélectionner (seulement si pas déjà sélectionné)
        if (value !== opt) {
          onChange(id, opt);
        }
        setLastTap({ opt, time: now });
      }
    };

    const handleDoubleClick = (opt: string) => {
      if (disabled) return;
      if (value === opt) onChange(id, "");
    };

    return (
      <fieldset className={disabled ? "opacity-50" : ""}>
        <LegendWithTooltip className="text-sm font-medium" tooltip={def.tooltip}>
          {def.label}
        </LegendWithTooltip>
        <div className="flex flex-col gap-2 mt-1">
          {def.options?.map((opt) => {
            const checked = value === opt;
            return (
              <label
                key={opt}
                className="inline-flex items-center gap-2 text-sm select-none"
                onDoubleClick={() => handleDoubleClick(opt)}
                onTouchEnd={() => handleTouch(opt)}
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
        <LegendWithTooltip className="text-sm font-medium" tooltip={def.tooltip}>
          {def.label}
        </LegendWithTooltip>
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

  if (def.type === "information") {
    return (
      <div>
        <h3 className="text-base font-semibold mb-3">{def.label}</h3>
      </div>
    );
  }

  return null;
}
