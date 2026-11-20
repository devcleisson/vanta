"use client";

import { Heart, Menu, Search, ShoppingBag, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { mainNav } from "@/config/site";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/utils";
import { selectCartCount, useCart } from "@/stores/cart-store";
import { useFavorites } from "@/stores/favorites-store";
import { Logo } from "./logo";
import { MobileNav } from "./mobile-nav";
import { SearchOverlay } from "./search-overlay";

export type HeaderUser = { name: string; role: "customer" | "admin" } | null;

export function Header({ user }: { user: HeaderUser }) {
  const pathname = usePathname();
  const overHero = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const hydrated = useHydrated();
  const count = useCart(selectCartCount);
  const lastAddedAt = useCart((s) => s.lastAddedAt);
  const openCart = useCart((s) => s.open);
  const favCount = useFavorites((s) => s.ids.length);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const transparent = overHero && !scrolled && !menuOpen;

  return (
    <>
      <div className="bg-ink text-paper">
        <p className="container-x flex h-9 items-center justify-center text-center text-[12px] tracking-wide">
          Frete grátis acima de R$ 499 e trocas em até 30 dias
        </p>
      </div>
      <header
        className={cn(
          "sticky top-0 z-40 transition-[background-color,color,border-color] duration-300",
          transparent
            ? "dark-surface border-b border-transparent bg-transparent text-paper"
            : "border-b border-stone/70 bg-paper/95 text-ink backdrop-blur supports-[backdrop-filter]:bg-paper/85",
          overHero && "-mb-16",
        )}
      >
        <div className="container-x grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-4">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="-ml-2.5 inline-flex size-11 items-center justify-center lg:hidden"
              aria-label="Abrir menu"
            >
              <Menu className="size-[22px]" strokeWidth={1.5} />
            </button>
            <nav aria-label="Principal" className="hidden lg:block">
              <ul className="flex items-center gap-6 text-[13px] font-medium">
                {mainNav.slice(0, 6).map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="link-underline py-1">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <Logo className="text-[26px] sm:text-[28px]" />

          <div className="flex items-center justify-end gap-0.5 sm:gap-1">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="inline-flex size-11 items-center justify-center"
              aria-label="Buscar produtos"
            >
              <Search className="size-[20px]" strokeWidth={1.5} />
            </button>
            <Link
              href={user ? "/account" : "/login"}
              className="hidden size-11 items-center justify-center sm:inline-flex"
              aria-label={user ? `Minha conta (${user.name})` : "Entrar"}
            >
              <User className="size-[20px]" strokeWidth={1.5} />
            </Link>
            <Link href="/favorites" className="relative inline-flex size-11 items-center justify-center" aria-label={`Favoritos (${hydrated ? favCount : 0})`}>
              <Heart className="size-[20px]" strokeWidth={1.5} />
              {hydrated && favCount > 0 && (
                <span className="absolute right-2 top-2 size-1.5 rounded-full bg-current" aria-hidden />
              )}
            </Link>
            <button
              type="button"
              onClick={openCart}
              className="relative -mr-2 inline-flex h-11 items-center gap-1.5 px-2.5"
              aria-label={`Abrir carrinho, ${hydrated ? count : 0} itens`}
            >
              <ShoppingBag className="size-[20px]" strokeWidth={1.5} />
              <span
                key={lastAddedAt}
                className={cn(
                  "min-w-5 text-[13px] font-semibold tabular-nums",
                  lastAddedAt > 0 && "animate-pop",
                )}
              >
                {hydrated ? count : 0}
              </span>
            </button>
          </div>
        </div>
      </header>
      <MobileNav open={menuOpen} onOpenChange={setMenuOpen} user={user} />
      <SearchOverlay open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
