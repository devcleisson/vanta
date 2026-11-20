"use client";

import { Dialog as D } from "radix-ui";
import { X } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

export const Sheet = D.Root;
export const SheetTrigger = D.Trigger;
export const SheetClose = D.Close;

export function SheetContent({
  side = "right",
  title,
  description,
  className,
  children,
  hideTitle,
}: {
  side?: "left" | "right";
  title: string;
  description?: string;
  className?: string;
  hideTitle?: boolean;
  children: React.ReactNode;
}) {
  return (
    <D.Portal>
      <D.Overlay className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-[2px] data-[state=closed]:animate-[fade_0.25s_reverse_both] data-[state=open]:animate-fade" />
      <D.Content
        className={cn(
          "fixed inset-y-0 z-50 flex w-full flex-col bg-paper shadow-2xl outline-none sm:max-w-[440px]",
          side === "right"
            ? "right-0 data-[state=closed]:animate-slide-out-right data-[state=open]:animate-slide-in-right"
            : "left-0 data-[state=closed]:animate-slide-out-left data-[state=open]:animate-slide-in-left",
          className,
        )}
      >
        <div className={cn("flex h-16 shrink-0 items-center justify-between border-b border-stone px-5", hideTitle && "sr-only")}>
          <D.Title className="text-[15px] font-semibold">{title}</D.Title>
          <D.Close className="-mr-2 inline-flex size-10 items-center justify-center hover:bg-concrete" aria-label="Fechar">
            <X className="size-5" />
          </D.Close>
        </div>
        {description ? <D.Description className="sr-only">{description}</D.Description> : <D.Description className="sr-only">{title}</D.Description>}
        {children}
      </D.Content>
    </D.Portal>
  );
}
