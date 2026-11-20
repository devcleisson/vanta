import type { MetadataRoute } from "next";
import { helpPages } from "@/config/help";
import { siteConfig } from "@/config/site";
import { getAllProductSlugs, listCategories } from "@/server/services/catalog";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url.replace(/\/$/, "");
  const [products, categories] = await Promise.all([getAllProductSlugs(), listCategories()]);
  return [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/shop`, changeFrequency: "daily", priority: 0.9 },
    ...categories.map((c) => ({ url: `${base}/shop/${c.slug}`, lastModified: c.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...products.map((p) => ({ url: `${base}/products/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...Object.keys(helpPages).map((slug) => ({ url: `${base}/help/${slug}`, changeFrequency: "monthly" as const, priority: 0.3 })),
  ];
}
