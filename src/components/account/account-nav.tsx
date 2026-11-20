"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/server/actions/auth";

const links = [
  { href: "/account", label: "Perfil" },
  { href: "/account/orders", label: "Pedidos" },
  { href: "/account/addresses", label: "Endereços" },
  { href: "/favorites", label: "Favoritos" },
];

export function AccountNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <nav aria-label="Conta" className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto border-b border-stone px-4 pb-px sm:-mx-6 sm:px-6 md:mx-0 md:flex-col md:border-0 md:px-0">
      {links.map((l) => {
        const active = l.href === "/account" ? pathname === "/account" : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "shrink-0 whitespace-nowrap border-b-2 px-1 py-3 text-[15px] md:border-b-0 md:border-l-2 md:px-4 md:py-2",
              active ? "border-ink font-semibold" : "border-transparent text-graphite hover:text-ink",
            )}
          >
            {l.label}
          </Link>
        );
      })}
      {isAdmin && (
        <Link href="/admin" className="shrink-0 whitespace-nowrap border-b-2 border-transparent px-1 py-3 text-[15px] text-graphite hover:text-ink md:border-b-0 md:border-l-2 md:px-4 md:py-2">
          Painel admin
        </Link>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            await logoutAction();
            router.replace("/");
            router.refresh();
          })
        }
        className="shrink-0 whitespace-nowrap border-b-2 border-transparent px-1 py-3 text-left text-[15px] text-graphite hover:text-ink md:mt-4 md:border-b-0 md:border-l-2 md:px-4 md:py-2"
      >
        {pending ? "Saindo…" : "Sair"}
      </button>
    </nav>
  );
}
