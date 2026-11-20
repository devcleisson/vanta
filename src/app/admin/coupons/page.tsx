import { CouponsManager } from "@/components/admin/crud-dialogs";
import { PageHeader } from "@/components/admin/ui";
import { listCoupons } from "@/server/services/admin/catalog-admin";

export const metadata = { title: "Cupons" };

export default async function CouponsPage() {
  const coupons = await listCoupons();
  return (
    <>
      <PageHeader title="Cupons" description="Descontos validados no servidor a cada pedido." />
      <CouponsManager coupons={coupons} />
    </>
  );
}
