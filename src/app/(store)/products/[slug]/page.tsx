import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/store/product-card";
import { ProductView } from "@/components/store/product-view";
import { SectionHeading } from "@/components/store/section-heading";
import { siteConfig } from "@/config/site";
import { effectivePrice } from "@/lib/pricing";
import { getProductBySlug, getRelatedProducts, getSuggestions } from "@/server/services/catalog";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProductBySlug((await params).slug);
  if (!product) return { title: "Produto não encontrado" };
  const description = product.description.slice(0, 155);
  return {
    title: product.name,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      type: "website",
      title: `${product.name} — VANTA`,
      description,
      images: product.images[0] ? [{ url: product.images[0].url, alt: product.images[0].alt }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const product = await getProductBySlug((await params).slug);
  if (!product) notFound();
  const [related, suggestions] = await Promise.all([getRelatedProducts(product), getSuggestions(product)]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.variants[0]?.sku,
    brand: { "@type": "Brand", name: "VANTA" },
    image: product.images.map((i) => new URL(i.url, siteConfig.url).toString()),
    offers: {
      "@type": "Offer",
      priceCurrency: "BRL",
      price: (effectivePrice(product) / 100).toFixed(2),
      availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${siteConfig.url}/products/${product.slug}`,
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="container-x pb-20 pt-6 md:pt-10">
        <ProductView product={product} />
      </div>
      {related.length > 0 && (
        <section aria-labelledby="related-title" className="container-x border-t border-stone py-20">
          <SectionHeading id="related-title" title="You may also like" href={product.category ? `/shop/${product.category.slug}` : "/shop"} linkLabel={product.category ? `Ver ${product.category.name}` : "Ver tudo"} />
          <ProductGrid products={related} />
        </section>
      )}
      {suggestions.length > 0 && (
        <section aria-labelledby="suggestions-title" className="container-x border-t border-stone py-20">
          <SectionHeading id="suggestions-title" title="Complete the look" />
          <ProductGrid products={suggestions} />
        </section>
      )}
    </>
  );
}
