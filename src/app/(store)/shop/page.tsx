import type { Metadata } from "next";
import { CatalogPage } from "@/components/store/catalog-page";
import type { SearchParams } from "@/lib/catalog-params";

export async function generateMetadata({ searchParams }: { searchParams: Promise<SearchParams> }): Promise<Metadata> {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : null;
  return {
    title: q ? `Busca por “${q}”` : "Shop all",
    description: "Todo o catálogo VANTA: camisetas, hoodies, sweatshirts, calças, outerwear e acessórios.",
    alternates: { canonical: "/shop" },
    robots: q ? { index: false } : undefined,
  };
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <CatalogPage searchParams={await searchParams} />;
}
