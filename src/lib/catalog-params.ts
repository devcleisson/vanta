import type { CatalogQuery, CatalogSort } from "@/types/catalog";

export type SearchParams = Record<string, string | string[] | undefined>;

const SORTS: CatalogSort[] = ["newest", "price-asc", "price-desc", "best-sellers"];

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const list = (v: string | string[] | undefined) =>
  (one(v) ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 20);

/** Parses URL search params into a safe catalogue query. Prices in the URL are whole reais. */
export function parseCatalogParams(sp: SearchParams, category?: string): CatalogQuery {
  const sort = one(sp.sort) as CatalogSort | undefined;
  const min = Number(one(sp.min));
  const max = Number(one(sp.max));
  const page = Number(one(sp.page));
  return {
    q: one(sp.q)?.slice(0, 80),
    category: category ?? one(sp.category),
    sizes: list(sp.size),
    colors: list(sp.color),
    minPrice: Number.isFinite(min) && min > 0 ? Math.round(min * 100) : undefined,
    maxPrice: Number.isFinite(max) && max > 0 ? Math.round(max * 100) : undefined,
    inStock: one(sp.stock) === "1",
    onSale: one(sp.sale) === "1",
    isNew: one(sp.new) === "1",
    sort: sort && SORTS.includes(sort) ? sort : "newest",
    page: Number.isFinite(page) && page > 0 ? Math.floor(page) : 1,
    perPage: 24,
  };
}

export const SORT_LABEL: Record<CatalogSort, string> = {
  newest: "Mais recentes",
  "best-sellers": "Mais vendidos",
  "price-asc": "Menor preço",
  "price-desc": "Maior preço",
};
