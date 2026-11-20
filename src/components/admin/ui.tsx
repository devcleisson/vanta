import Link from "next/link";
import * as React from "react";
import { cn } from "@/lib/utils";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-[26px] font-semibold tracking-tight sm:text-[30px]">{title}</h1>
        {description && <p className="mt-1 text-[14px] text-smoke">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, action, children, className }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("border border-stone bg-paper", className)}>
      {title && (
        <div className="flex items-center justify-between gap-3 border-b border-stone px-5 py-3.5">
          <h2 className="text-[14px] font-semibold">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export const tableClass = "w-full text-left text-[14px] [&_th]:h-10 [&_th]:px-4 [&_th]:text-[12px] [&_th]:font-medium [&_th]:text-smoke [&_td]:px-4 [&_td]:py-3 [&_tbody_tr]:border-t [&_tbody_tr]:border-stone";

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className={cn(tableClass, className)}>{children}</table>
    </div>
  );
}

/** GET-based filter bar: keeps filters in the URL so views are shareable and work without JS. */
export function FilterBar({ children, resetHref }: { children: React.ReactNode; resetHref: string }) {
  return (
    <form method="get" className="mb-5 flex flex-wrap items-end gap-2">
      {children}
      <button type="submit" className="h-10 bg-ink px-4 text-[13px] font-medium text-paper hover:bg-graphite">Filtrar</button>
      <Link href={resetHref} className="inline-flex h-10 items-center px-3 text-[13px] underline-offset-4 hover:underline">Limpar</Link>
    </form>
  );
}

export const filterInput = "h-10 border border-stone bg-paper px-3 text-[14px] outline-none hover:border-smoke focus:border-ink";

export function FilterLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-[12px] text-smoke">
      {label}
      {children}
    </label>
  );
}
