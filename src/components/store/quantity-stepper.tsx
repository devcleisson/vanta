"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuantityStepper({
  value,
  onChange,
  max,
  min = 1,
  size = "md",
  label = "Quantidade",
}: {
  value: number;
  onChange: (n: number) => void;
  max: number;
  min?: number;
  size?: "sm" | "md";
  label?: string;
}) {
  const h = size === "sm" ? "h-9" : "h-12";
  const w = size === "sm" ? "w-9" : "w-12";
  return (
    <div className={cn("inline-flex items-center border border-stone", h)} role="group" aria-label={label}>
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        className={cn("inline-flex h-full items-center justify-center hover:bg-concrete disabled:opacity-30", w)}
        aria-label="Diminuir quantidade"
      >
        <Minus className="size-3.5" />
      </button>
      <span className={cn("text-center text-sm font-medium tabular-nums", size === "sm" ? "w-7" : "w-10")} aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        className={cn("inline-flex h-full items-center justify-center hover:bg-concrete disabled:opacity-30", w)}
        aria-label="Aumentar quantidade"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}
