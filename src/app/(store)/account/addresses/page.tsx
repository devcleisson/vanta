import type { Metadata } from "next";
import { AddressManager } from "@/components/account/address-manager";
import { requireUser } from "@/server/auth/session";
import { listAddresses } from "@/server/services/account";

export const metadata: Metadata = { title: "Endereços", robots: { index: false } };

export default async function AddressesPage() {
  const user = await requireUser("/account/addresses");
  const addresses = await listAddresses(user.id);
  return <AddressManager addresses={addresses} />;
}
