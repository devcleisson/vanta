import * as React from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-concrete", className)} aria-hidden />;
}

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "ink" | "success" | "warning" | "danger" | "outline";
  className?: string;
}) {
  const tones = {
    neutral: "bg-concrete text-ink",
    ink: "bg-ink text-paper",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    danger: "bg-danger/10 text-danger",
    outline: "border border-stone text-graphite",
  };
  return (
    <span className={cn("inline-flex h-6 items-center whitespace-nowrap px-2 text-[12px] font-medium", tones[tone], className)}>
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-16 text-center", className)}>
      {icon && <div className="mb-5 text-smoke [&_svg]:size-8" aria-hidden>{icon}</div>}
      <p className="text-lg font-semibold">{title}</p>
      {description && <p className="mt-2 max-w-sm text-[15px] text-smoke">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
