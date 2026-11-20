import { AttributesManager } from "@/components/admin/crud-dialogs";
import { PageHeader } from "@/components/admin/ui";
import { listAttributes } from "@/server/services/admin/catalog-admin";

export const metadata = { title: "Tamanhos e cores" };

export default async function AttributesPage() {
  const { sizes, colors } = await listAttributes();
  return (
    <>
      <PageHeader title="Tamanhos e cores" description="Atributos usados para montar as variações de cada produto." />
      <AttributesManager sizes={sizes} colors={colors} />
    </>
  );
}
