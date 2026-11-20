import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { PageHeader } from "@/components/admin/ui";
import { getAdminProduct, getProductFormOptions } from "@/server/services/admin/catalog-admin";

export const metadata = { title: "Editar produto" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [product, options] = await Promise.all([getAdminProduct(id), getProductFormOptions()]);
  if (!product) notFound();

  return (
    <>
      <Link href="/admin/products" className="text-[13px] text-smoke hover:text-ink">Produtos</Link>
      <PageHeader
        title={product.name}
        actions={
          product.isActive ? (
            <Link href={`/products/${product.slug}`} target="_blank" className="text-[13px] underline underline-offset-4">Ver na loja</Link>
          ) : undefined
        }
      />
      <div className="bg-paper px-4 sm:px-6 lg:px-8">
        <ProductForm
          productId={product.id}
          options={options}
          defaults={{
            name: product.name,
            slug: product.slug,
            description: product.description,
            details: (product.details ?? []).join("\n"),
            categoryId: product.categoryId ?? "",
            price: product.price / 100,
            salePrice: product.salePrice != null ? product.salePrice / 100 : "",
            isActive: product.isActive,
            isNew: product.isNew,
            isBestSeller: product.isBestSeller,
            isFeatured: product.isFeatured,
            variants: product.variants
              .map((v) => ({ id: v.id, sizeId: v.sizeId, colorId: v.colorId, sku: v.sku, stock: v.stock }))
              .sort((a, b) => {
                const ca = options.colors.findIndex((c) => c.id === a.colorId) - options.colors.findIndex((c) => c.id === b.colorId);
                return ca || options.sizes.findIndex((s) => s.id === a.sizeId) - options.sizes.findIndex((s) => s.id === b.sizeId);
              }),
            images: product.images.map((i) => ({ url: i.url, alt: i.alt, colorId: i.colorId })),
          }}
        />
      </div>
    </>
  );
}
