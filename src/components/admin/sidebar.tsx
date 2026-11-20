"use client";

import { BarChart3, ExternalLink, FolderTree, LogOut, Menu, Package, Palette, ShoppingCart, Tag, Users } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/server/actions/auth";

const nav = [
  { href: "/admin", label: "Visão geral", icon: BarChart3 },
  { href: "/admin/orders", label: "Pedidos", icon: ShoppingCart },
  { href: "/admin/products", label: "Produtos", icon: Package },
  { href: "/admin/categories", label: "Categorias", icon: FolderTree },
  { href: "/admin/attributes", label: "Tamanhos e cores", icon: Palette },
  { href: "/admin/coupons", label: "Cupons", icon: Tag },
  { href: "/admin/customers", label: "Clientes", icon: Users },
];

function NavLinks({ onNavigate, counts }: { onNavigate?: () => void; counts: { pendingOrders: number } }) {
  const pathname = usePathname();
  return (
    <ul className="space-y-0.5">
      {nav.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
        return (
          <li key={href}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-10 items-center gap-3 px-3 text-[14px] transition-colors",
                active ? "bg-paper text-ink" : "text-paper/70 hover:bg-paper/10 hover:text-paper",
              )}
            >
              <Icon className="size-4" strokeWidth={1.75} />
              <span className="flex-1">{label}</span>
              {href === "/admin/orders" && counts.pendingOrders > 0 && (
                <span className={cn("min-w-5 px-1.5 text-center text-[11px] font-semibold", active ? "bg-ink text-paper" : "bg-paper text-ink")}>
                  {counts.pendingOrders}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function Footer({ user }: { user: { name: string; email: string } }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <div className="space-y-1 border-t border-paper/15 pt-4">
      <Link href="/" className="flex h-10 items-center gap-3 px-3 text-[14px] text-paper/70 hover:text-paper">
        <ExternalLink className="size-4" /> Ver loja
      </Link>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            await logoutAction();
            router.replace("/login");
            router.refresh();
          })
        }
        className="flex h-10 w-full items-center gap-3 px-3 text-[14px] text-paper/70 hover:text-paper"
      >
        <LogOut className="size-4" /> {pending ? "Saindo…" : "Sair"}
      </button>
      <div className="px-3 pt-3 text-[12px] text-paper/50">
        <p className="truncate text-paper/80">{user.name}</p>
        <p className="truncate">{user.email}</p>
      </div>
    </div>
  );
}

export function AdminSidebar({ user, counts }: { user: { name: string; email: string }; counts: { pendingOrders: number } }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <aside className="dark-surface fixed inset-y-0 left-0 hidden w-60 flex-col bg-ink p-4 text-paper lg:flex">
        <Link href="/admin" className="mb-8 flex items-baseline gap-2 px-3 pt-2">
          <span className="display text-[22px]">VANTA</span>
          <span className="text-[12px] text-paper/50">Admin</span>
        </Link>
        <nav aria-label="Administração" className="flex-1">
          <NavLinks counts={counts} />
        </nav>
        <Footer user={user} />
      </aside>

      <header className="dark-surface sticky top-0 z-30 flex h-14 items-center justify-between bg-ink px-4 text-paper lg:hidden">
        <button type="button" onClick={() => setOpen(true)} className="-ml-2 inline-flex size-10 items-center justify-center" aria-label="Abrir menu">
          <Menu className="size-5" />
        </button>
        <span className="display text-[18px]">VANTA Admin</span>
        <span className="w-10" />
      </header>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" title="Administração" className="dark-surface bg-ink text-paper sm:max-w-[280px] [&>div:first-child]:border-paper/15">
          <div className="flex flex-1 flex-col p-4">
            <nav aria-label="Administração" className="flex-1">
              <NavLinks counts={counts} onNavigate={() => setOpen(false)} />
            </nav>
            <Footer user={user} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
