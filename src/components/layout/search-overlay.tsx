"use client";

import { Dialog as D } from "radix-ui";
import { Search, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { formatPrice } from "@/lib/format";
import { effectivePrice } from "@/lib/pricing";
import { searchSuggestAction } from "@/server/actions/catalog";
import type { ProductCardData } from "@/types/catalog";

const POPULAR = ["Hoodie", "Oversized", "Cargo", "Boné", "Preto"];

export function SearchOverlay({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<ProductCardData[]>([]);
  const [pending, start] = useTransition();

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => start(async () => setResults(await searchSuggestAction(term))), 220);
    return () => clearTimeout(t);
  }, [q]);

  const submit = (term: string) => {
    if (!term.trim()) return;
    onOpenChange(false);
    router.push(`/shop?q=${encodeURIComponent(term.trim())}`);
  };

  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-50 bg-ink/40 data-[state=open]:animate-fade" />
        <D.Content className="fixed inset-x-0 top-0 z-50 max-h-[90dvh] overflow-y-auto bg-paper outline-none data-[state=open]:animate-fade">
          <D.Title className="sr-only">Buscar produtos</D.Title>
          <D.Description className="sr-only">Digite para ver sugestões de produtos</D.Description>
          <div className="container-x py-5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit(q);
              }}
              className="flex items-center gap-3 border-b border-ink pb-3"
              role="search"
            >
              <Search className="size-5 shrink-0" strokeWidth={1.5} />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar hoodies, cargos, acessórios…"
                aria-label="Buscar"
                className="h-12 w-full bg-transparent text-xl outline-none placeholder:text-smoke sm:text-2xl"
              />
              <D.Close className="inline-flex size-10 shrink-0 items-center justify-center hover:bg-concrete" aria-label="Fechar busca">
                <X className="size-5" />
              </D.Close>
            </form>

            <div className="py-6">
              {q.trim().length < 2 ? (
                <div>
                  <p className="text-[13px] text-smoke">Mais buscados</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {POPULAR.map((term) => (
                      <button key={term} onClick={() => submit(term)} className="h-9 border border-stone px-4 text-sm hover:border-ink">
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              ) : results.length === 0 ? (
                <p className="text-[15px] text-smoke">{pending ? "Buscando…" : `Nenhum produto para “${q.trim()}”. Tente outro termo.`}</p>
              ) : (
                <div>
                  <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                    {results.map((p) => (
                      <li key={p.id}>
                        <Link href={`/products/${p.slug}`} onClick={() => onOpenChange(false)} className="group block">
                          <div className="relative aspect-[4/5] overflow-hidden bg-concrete">
                            {p.image && (
                              <Image src={p.image.url} alt={p.image.alt} fill sizes="200px" unoptimized className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                            )}
                          </div>
                          <p className="mt-2 text-[13px] font-medium">{p.name}</p>
                          <p className="text-[13px] text-smoke">{formatPrice(effectivePrice(p))}</p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => submit(q)} className="mt-6 inline-flex items-center gap-2 text-sm font-medium underline-offset-4 hover:underline">
                    Ver todos os resultados para “{q.trim()}”
                  </button>
                </div>
              )}
            </div>
          </div>
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}
