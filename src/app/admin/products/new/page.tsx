import Link from "next/link";
import { ProductForm } from "@/components/admin/product-form";
import { PageHeader } from "@/components/admin/ui";
import { getProductFormOptions } from "@/server/services/admin/catalog-admin";

export const metadata = { title: "Novo produto" };

export default async function NewProductPage() {
  const options = await getProductFormOptions();
  return (
    <>
      <Link href="/admin/products" className="text-[13px] text-smoke hover:text-ink">Produtos</Link>
      <PageHeader title="Novo produto" />
      <div className="bg-paper px-4 sm:px-6 lg:px-8">
        <ProductForm options={options} />
      </div>
    </>
  );
}
