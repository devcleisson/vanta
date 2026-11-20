import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogPage } from "@/components/store/catalog-page";
import type { SearchParams } from "@/lib/catalog-params";
import { getCategoryBySlug } from "@/server/services/catalog";

type Props = { params: Promise<{ category: string }>; searchParams: Promise<SearchParams> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = await getCategoryBySlug((await params).category);
  if (!category) return { title: "Categoria não encontrada" };
  return {
    title: category.name,
    description: category.description ?? `${category.name} VANTA.`,
    alternates: { canonical: `/shop/${category.slug}` },
    openGraph: { title: `${category.name} — VANTA`, description: category.description ?? undefined, images: category.imageUrl ? [category.imageUrl] : undefined },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const category = await getCategoryBySlug((await params).category);
  if (!category) notFound();
  return <CatalogPage searchParams={await searchParams} category={category} />;
}
