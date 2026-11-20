"use client";

import Link from "next/link";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { mainNav } from "@/config/site";
import type { HeaderUser } from "./header";

export function MobileNav({ open, onOpenChange, user }: { open: boolean; onOpenChange: (o: boolean) => void; user: HeaderUser }) {
  const close = () => onOpenChange(false);
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" title="Menu">
        <nav aria-label="Menu" className="flex-1 overflow-y-auto px-5 py-6">
          <ul className="space-y-1">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} onClick={close} className="display-tight block py-2.5 text-[26px] leading-none">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="space-y-1 border-t border-stone px-5 py-5 text-[15px]">
          {user ? (
            <>
              <Link href="/account" onClick={close} className="block py-2">Minha conta</Link>
              <Link href="/account/orders" onClick={close} className="block py-2">Meus pedidos</Link>
              {user.role === "admin" && (
                <Link href="/admin" onClick={close} className="block py-2">Painel administrativo</Link>
              )}
            </>
          ) : (
            <>
              <Link href="/login" onClick={close} className="block py-2">Entrar</Link>
              <Link href="/register" onClick={close} className="block py-2">Criar conta</Link>
            </>
          )}
          <Link href="/favorites" onClick={close} className="block py-2">Favoritos</Link>
          <Link href="/help/contato" onClick={close} className="block py-2">Atendimento</Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
