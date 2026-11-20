import { SearchX } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { parseCatalogParams, type SearchParams } from "@/lib/catalog-params";
import { cn } from "@/lib/utils";
import { getFilterOptions, listCategories, searchProducts } from "@/server/services/catalog";
import { CatalogSidebar, CatalogToolbar } from "./catalog-filters";
import { ProductGrid } from "./product-card";

export async function CatalogPage({
  searchParams,
  category,
}: {
  searchParams: SearchParams;
  category?: { name: string; slug: string; description: string | null };
}) {
  const query = parseCatalogParams(searchParams, category?.slug);
  const [result, categories, options] = await Promise.all([searchProducts(query), listCategories(), getFilterOptions()]);

  const title = query.q ? `Busca: ${query.q}` : category?.name ?? (query.isNew ? "New arrivals" : "Shop all");
  const pageHref = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) if (typeof v === "string" && k !== "page") sp.set(k, v);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return `${category ? `/shop/${category.slug}` : "/shop"}${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="container-x pb-24 pt-10 md:pt-14">
      <header className="mb-6 md:mb-10">
        <h1 className="display break-words text-[clamp(2.5rem,8vw,6.5rem)]">{title}</h1>
        {category?.description && !query.q && <p className="mt-4 max-w-xl text-[15px] text-graphite">{category.description}</p>}
        <p className="mt-3 text-[14px] text-smoke lg:hidden">
          {result.total} {result.total === 1 ? "produto" : "produtos"}
        </p>
      </header>

      <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
        <Suspense>
          <CatalogSidebar categories={categories} options={options} activeCategory={category?.slug} />
        </Suspense>
        <div>
          <Suspense>
            <CatalogToolbar total={result.total} categories={categories} options={options} activeCategory={category?.slug} sort={query.sort ?? "newest"} />
          </Suspense>
          {result.items.length === 0 ? (
            <EmptyState
              icon={<SearchX strokeWidth={1.25} />}
              title="Nenhum produto com esses filtros"
              description="Remova alguns filtros ou tente outro termo de busca."
              action={
                <Button asChild variant="outline">
                  <Link href={category ? `/shop/${category.slug}` : "/shop"}>Limpar filtros</Link>
                </Button>
              }
            />
          ) : (
            <>
              <ProductGrid products={result.items} priorityCount={4} className="mt-4 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4" />
              {result.pageCount > 1 && (
                <nav aria-label="Paginação" className="mt-14 flex items-center justify-center gap-1">
                  {Array.from({ length: result.pageCount }, (_, i) => i + 1).map((p) => (
                    <Link
                      key={p}
                      href={pageHref(p)}
                      aria-current={p === result.page ? "page" : undefined}
                      className={cn("inline-flex size-10 items-center justify-center text-[14px]", p === result.page ? "bg-ink text-paper" : "hover:bg-concrete")}
                    >
                      {p}
                    </Link>
                  ))}
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
