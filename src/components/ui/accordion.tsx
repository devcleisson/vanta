"use client";

import { Accordion as A } from "radix-ui";
import { Plus } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

export const Accordion = A.Root;

export function AccordionItem({ value, title, children, className }: { value: string; title: string; children: React.ReactNode; className?: string }) {
  return (
    <A.Item value={value} className={cn("border-b border-stone", className)}>
      <A.Header>
        <A.Trigger className="group flex w-full items-center justify-between py-4 text-left text-[15px] font-medium">
          {title}
          <Plus className="size-4 transition-transform duration-300 group-data-[state=open]:rotate-45" />
        </A.Trigger>
      </A.Header>
      <A.Content className="overflow-hidden text-[14px] leading-relaxed text-graphite data-[state=closed]:animate-[fade_0.2s_reverse] data-[state=open]:animate-fade">
        <div className="pb-5">{children}</div>
      </A.Content>
    </A.Item>
  );
}
