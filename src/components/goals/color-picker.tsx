"use client";

import { cn } from "@/lib/utils";
import { GOAL_COLOR_SWATCHES } from "./constants";

export function ColorPicker({
  value,
  onChange,
  name,
}: {
  value: string;
  onChange: (color: string) => void;
  name: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {GOAL_COLOR_SWATCHES.map((swatch) => (
        <button
          key={swatch}
          type="button"
          onClick={() => onChange(swatch)}
          className={cn(
            "size-7 shrink-0 rounded-full border-2 transition-transform",
            value.toLowerCase() === swatch.toLowerCase()
              ? "scale-110 border-[var(--foreground)]"
              : "border-transparent"
          )}
          style={{ backgroundColor: swatch }}
          aria-label={`Use color ${swatch}`}
          aria-pressed={value.toLowerCase() === swatch.toLowerCase()}
        />
      ))}
      <input type="hidden" name={name} value={value} />
    </div>
  );
}
