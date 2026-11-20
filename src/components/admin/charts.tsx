"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatPrice, formatPriceCompact } from "@/lib/format";

/*
 * All dashboard charts are single-series, so they use one ink colour and no
 * legend; the panel title names the series. Thin marks, recessive grid,
 * tooltips on every chart, and a table alternative is linked from each panel.
 */
const INK = "#000000";
const GRID = "#e4e3e0";
const AXIS = { fontSize: 12, fill: "#807f7c" };

function Tip({ active, payload, label, kind, fmt }: { active?: boolean; payload?: { value: number }[]; label?: string; kind: "money" | "count"; fmt?: (l: string) => string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="border border-stone bg-paper px-3 py-2 text-[12px] shadow-sm">
      <p className="text-smoke">{label && fmt ? fmt(String(label)) : label}</p>
      <p className="mt-0.5 text-[14px] font-semibold tabular-nums">{kind === "money" ? formatPrice(payload[0].value) : payload[0].value}</p>
    </div>
  );
}

const shortDay = (d: string) => {
  const [, m, day] = d.split("-");
  return `${day}/${m}`;
};
const shortMonth = (m: string) => {
  const [y, mo] = m.split("-");
  return new Date(Number(y), Number(mo) - 1, 1).toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
};

export function RevenueLine({ data }: { data: { day: string; revenue: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="day" tickFormatter={shortDay} tick={AXIS} axisLine={false} tickLine={false} minTickGap={24} />
        <YAxis tickFormatter={(v) => formatPriceCompact(v)} tick={AXIS} axisLine={false} tickLine={false} width={64} />
        <Tooltip content={<Tip kind="money" fmt={shortDay} />} cursor={{ stroke: INK, strokeWidth: 1, strokeDasharray: "3 3" }} />
        <Line type="linear" dataKey="revenue" stroke={INK} strokeWidth={2} dot={false} activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function OrdersBars({ data }: { data: { day: string; orders: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap={2}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="day" tickFormatter={shortDay} tick={AXIS} axisLine={false} tickLine={false} minTickGap={24} />
        <YAxis allowDecimals={false} tick={AXIS} axisLine={false} tickLine={false} width={32} />
        <Tooltip content={<Tip kind="count" fmt={shortDay} />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
        <Bar dataKey="orders" fill={INK} radius={[4, 4, 0, 0]} maxBarSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MonthlyRevenue({ data }: { data: { month: string; revenue: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="month" tickFormatter={shortMonth} tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={(v) => formatPriceCompact(v)} tick={AXIS} axisLine={false} tickLine={false} width={64} />
        <Tooltip content={<Tip kind="money" fmt={shortMonth} />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
        <Bar dataKey="revenue" fill={INK} radius={[4, 4, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Horizontal bars in plain HTML: direct labels, no legend needed. */
export function HBarList({ rows, format }: { rows: { label: string; value: number; hint?: string }[]; format?: (n: number) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label} className="group" title={`${r.label}: ${format ? format(r.value) : r.value}`}>
          <div className="mb-1 flex justify-between gap-3 text-[13px]">
            <span className="truncate">{r.label}</span>
            <span className="shrink-0 font-medium tabular-nums">
              {format ? format(r.value) : r.value}
              {r.hint && <span className="ml-1.5 font-normal text-smoke">{r.hint}</span>}
            </span>
          </div>
          <div className="h-2 bg-concrete">
            <div className="h-full rounded-r-[4px] bg-ink transition-opacity group-hover:opacity-80" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
