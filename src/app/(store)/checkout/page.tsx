import type { Metadata } from "next";
import { CheckoutForm, type CheckoutDefaults } from "@/components/store/checkout-form";
import { activePaymentProvider } from "@/server/payments";
import { getCurrentUser } from "@/server/auth/session";
import { getProfile, listAddresses } from "@/server/services/account";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  let defaults: CheckoutDefaults = { signedIn: false };
  if (user) {
    const [profile, addresses] = await Promise.all([getProfile(user.id), listAddresses(user.id)]);
    const address = addresses.find((a) => a.isDefault) ?? addresses[0];
    defaults = {
      signedIn: true,
      email: user.email,
      fullName: profile?.fullName ?? undefined,
      phone: profile?.phone ?? undefined,
      cpf: profile?.cpf ?? undefined,
      address: address
        ? {
            recipient: address.recipient,
            cep: address.cep,
            street: address.street,
            number: address.number,
            complement: address.complement ?? "",
            district: address.district,
            city: address.city,
            state: address.state as never,
          }
        : undefined,
    };
  }

  return (
    <div className="container-x pb-24 pt-10 md:pt-14">
      <h1 className="display mb-10 text-[clamp(2.5rem,7vw,5.5rem)]">Checkout</h1>
      <CheckoutForm defaults={defaults} paymentMode={activePaymentProvider()} />
    </div>
  );
}
