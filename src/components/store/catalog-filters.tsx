"use client";

import { SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { inputClass } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { SORT_LABEL } from "@/lib/catalog-params";
import { cn } from "@/lib/utils";
import type { CatalogSort, ColorOption, SizeOption } from "@/types/catalog";

type Category = { name: string; slug: string };
type Options = { sizes: SizeOption[]; colors: ColorOption[]; priceRange: { min: number; max: number } };

function useCatalogUrl() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();

  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(changes)) {
      if (v == null || v === "") next.delete(k);
      else next.set(k, v);
    }
    if (!("page" in changes)) next.delete("page");
    const qs = next.toString();
    start(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };
  const toggleInList = (key: string, value: string) => {
    const current = (params.get(key) ?? "").split(",").filter(Boolean);
    const next = current.includes(value) ? current.filter((x) => x !== value) : [...current, value];
    update({ [key]: next.join(",") || null });
  };
  return { params, update, toggleInList, pending, pathname };
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-t border-stone py-5">
      <legend className="sr-only">{title}</legend>
      <p className="mb-3 text-[13px] font-semibold" aria-hidden>{title}</p>
      {children}
    </fieldset>
  );
}

function FilterControls({ categories, options, activeCategory }: { categories: Category[]; options: Options; activeCategory?: string }) {
  const { params, update, toggleInList } = useCatalogUrl();
  const sizes = (params.get("size") ?? "").split(",").filter(Boolean);
  const colors = (params.get("color") ?? "").split(",").filter(Boolean);
  const [min, setMin] = useState(params.get("min") ?? "");
  const [max, setMax] = useState(params.get("max") ?? "");
  const qs = params.toString();

  useEffect(() => {
    setMin(params.get("min") ?? "");
    setMax(params.get("max") ?? "");
  }, [params]);

  return (
    <div>
      <FilterGroup title="Categoria">
        <ul className="space-y-1.5 text-[14px]">
          <li>
            <Link href={`/shop${qs ? `?${qs}` : ""}`} className={cn("link-underline", !activeCategory && "font-semibold")} aria-current={!activeCategory ? "page" : undefined}>
              Todas
            </Link>
          </li>
          {categories.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/shop/${c.slug}${qs ? `?${qs}` : ""}`}
                className={cn("link-underline", activeCategory === c.slug && "font-semibold")}
                aria-current={activeCategory === c.slug ? "page" : undefined}
              >
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </FilterGroup>

      <FilterGroup title="Tamanho">
        <div className="grid grid-cols-4 gap-1.5">
          {options.sizes.map((s) => {
            const on = sizes.includes(s.label);
            return (
              <button
                key={s.id}
                type="button"
                aria-pressed={on}
                onClick={() => toggleInList("size", s.label)}
                className={cn("h-10 border text-[13px] font-medium transition-colors", on ? "border-ink bg-ink text-paper" : "border-stone hover:border-ink")}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </FilterGroup>

      <FilterGroup title="Cor">
        <ul className="space-y-2">
          {options.colors.map((c) => {
            const on = colors.includes(c.slug);
            return (
              <li key={c.id}>
                <button type="button" aria-pressed={on} onClick={() => toggleInList("color", c.slug)} className="flex w-full items-center gap-3 text-[14px]">
                  <span className={cn("size-5 rounded-full ring-1 ring-ink/20 ring-offset-2 transition", on && "ring-2 ring-ink")} style={{ backgroundColor: c.hex }} />
                  <span className={cn(on && "font-semibold")}>{c.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </FilterGroup>

      <FilterGroup title="Preço (R$)">
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            update({ min: min || null, max: max || null });
          }}
        >
          <label className="sr-only" htmlFor="price-min">Preço mínimo</label>
          <input id="price-min" inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))} placeholder={String(Math.floor(options.priceRange.min / 100))} className={cn(inputClass, "h-10 text-[14px]")} />
          <span className="text-smoke">–</span>
          <label className="sr-only" htmlFor="price-max">Preço máximo</label>
          <input id="price-max" inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))} placeholder={String(Math.ceil(options.priceRange.max / 100))} className={cn(inputClass, "h-10 text-[14px]")} />
          <Button type="submit" variant="outline" size="sm" className="h-10">OK</Button>
        </form>
      </FilterGroup>

      <FilterGroup title="Disponibilidade">
        <div className="space-y-3 text-[14px]">
          {[
            { key: "stock", label: "Somente em estoque" },
            { key: "sale", label: "Em promoção" },
            { key: "new", label: "Lançamentos" },
          ].map((o) => (
            <label key={o.key} className="flex cursor-pointer items-center gap-3">
              <Checkbox checked={params.get(o.key) === "1"} onCheckedChange={(v) => update({ [o.key]: v ? "1" : null })} />
              {o.label}
            </label>
          ))}
        </div>
      </FilterGroup>
    </div>
  );
}

export function CatalogToolbar({
  total,
  categories,
  options,
  activeCategory,
  sort,
}: {
  total: number;
  categories: Category[];
  options: Options;
  activeCategory?: string;
  sort: CatalogSort;
}) {
  const { params, update, pending, pathname } = useCatalogUrl();
  const [open, setOpen] = useState(false);

  const chips: { label: string; remove: Record<string, string | null> }[] = [];
  const q = params.get("q");
  if (q) chips.push({ label: `“${q}”`, remove: { q: null } });
  for (const s of (params.get("size") ?? "").split(",").filter(Boolean)) {
    chips.push({ label: `Tam. ${s}`, remove: { size: (params.get("size") ?? "").split(",").filter((x) => x && x !== s).join(",") || null } });
  }
  for (const c of (params.get("color") ?? "").split(",").filter(Boolean)) {
    const name = options.colors.find((x) => x.slug === c)?.name ?? c;
    chips.push({ label: name, remove: { color: (params.get("color") ?? "").split(",").filter((x) => x && x !== c).join(",") || null } });
  }
  if (params.get("min") || params.get("max")) chips.push({ label: `R$ ${params.get("min") || "0"} – ${params.get("max") || "∞"}`, remove: { min: null, max: null } });
  if (params.get("stock") === "1") chips.push({ label: "Em estoque", remove: { stock: null } });
  if (params.get("sale") === "1") chips.push({ label: "Promoção", remove: { sale: null } });
  if (params.get("new") === "1") chips.push({ label: "Lançamentos", remove: { new: null } });

  return (
    <>
      <div className="sticky top-16 z-20 -mx-4 border-b border-stone bg-paper/95 px-4 backdrop-blur sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0 lg:backdrop-blur-none">
        <div className="flex h-14 items-center justify-between gap-4">
          <button type="button" onClick={() => setOpen(true)} className="inline-flex h-10 items-center gap-2 text-[14px] font-medium lg:hidden">
            <SlidersHorizontal className="size-4" /> Filtros {chips.length > 0 && `(${chips.length})`}
          </button>
          <p className={cn("hidden text-[14px] text-smoke transition-opacity lg:block", pending && "opacity-50")} aria-live="polite">
            {total} {total === 1 ? "produto" : "produtos"}
          </p>
          <label className="flex items-center gap-2 text-[14px]">
            <span className="hidden text-smoke sm:inline">Ordenar por</span>
            <select
              value={sort}
              onChange={(e) => update({ sort: e.target.value === "newest" ? null : e.target.value })}
              className="h-10 cursor-pointer bg-transparent pr-1 font-medium outline-none"
              aria-label="Ordenar produtos"
            >
              {(Object.keys(SORT_LABEL) as CatalogSort[]).map((k) => (
                <option key={k} value={k}>{SORT_LABEL[k]}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {chips.length > 0 && (
        <div className="mb-6 mt-4 flex flex-wrap items-center gap-2 lg:mt-0">
          {chips.map((c) => (
            <button key={c.label} type="button" onClick={() => update(c.remove)} className="inline-flex h-8 items-center gap-1.5 bg-concrete px-3 text-[13px] hover:bg-stone">
              {c.label} <X className="size-3.5" aria-label="remover" />
            </button>
          ))}
          <Link href={pathname} className="ml-1 text-[13px] underline underline-offset-4">Limpar tudo</Link>
        </div>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" title="Filtros">
          <div className="flex-1 overflow-y-auto px-5">
            <FilterControls categories={categories} options={options} activeCategory={activeCategory} />
          </div>
          <div className="border-t border-stone p-5">
            <Button size="lg" className="w-full" onClick={() => setOpen(false)}>
              {pending ? "Atualizando…" : `Ver ${total} ${total === 1 ? "produto" : "produtos"}`}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export function CatalogSidebar(props: { categories: Category[]; options: Options; activeCategory?: string }) {
  return (
    <aside aria-label="Filtros" className="hidden lg:block">
      <div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto pb-10 pr-2">
        <FilterControls {...props} />
      </div>
    </aside>
  );
}
