import { CategoriesManager } from "@/components/admin/crud-dialogs";
import { PageHeader } from "@/components/admin/ui";
import { listCategoriesWithCounts } from "@/server/services/admin/catalog-admin";

export const metadata = { title: "Categorias" };

export default async function CategoriesPage() {
  const categories = await listCategoriesWithCounts();
  return (
    <>
      <PageHeader title="Categorias" description="Organizam o catálogo e geram as páginas /shop/categoria." />
      <CategoriesManager categories={categories} />
    </>
  );
}
