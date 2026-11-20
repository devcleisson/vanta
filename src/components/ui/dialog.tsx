"use client";

import { Dialog as D } from "radix-ui";
import { X } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

export const Dialog = D.Root;
export const DialogTrigger = D.Trigger;
export const DialogClose = D.Close;

export function DialogContent({
  title,
  description,
  className,
  children,
  hideHeader,
}: {
  title: string;
  description?: string;
  className?: string;
  hideHeader?: boolean;
  children: React.ReactNode;
}) {
  return (
    <D.Portal>
      <D.Overlay className="fixed inset-0 z-50 bg-ink/50 data-[state=open]:animate-fade" />
      <D.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 max-h-[92dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto bg-paper p-6 shadow-2xl outline-none data-[state=open]:animate-fade",
          className,
        )}
      >
        <div className={cn("mb-5 flex items-start justify-between gap-4", hideHeader && "sr-only")}>
          <div>
            <D.Title className="text-lg font-semibold">{title}</D.Title>
            {description && <D.Description className="mt-1 text-sm text-smoke">{description}</D.Description>}
          </div>
        </div>
        {!description && <D.Description className="sr-only">{title}</D.Description>}
        <D.Close className="absolute right-3 top-3 z-10 inline-flex size-10 items-center justify-center bg-paper/80 hover:bg-concrete" aria-label="Fechar">
          <X className="size-5" />
        </D.Close>
        {children}
      </D.Content>
    </D.Portal>
  );
}

/** Confirmation dialog for destructive actions. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  loading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  loading?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={title} description={description} className="max-w-md">
        <div className="mt-2 flex justify-end gap-2">
          <D.Close className="h-11 px-5 text-sm font-medium hover:bg-concrete">Voltar</D.Close>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="h-11 bg-danger px-5 text-sm font-medium text-paper hover:bg-danger/90 disabled:opacity-50"
          >
            {loading ? "Aguarde…" : confirmLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
