import type { Metadata } from "next";
import { ChangePasswordForm, ProfileForm } from "@/components/account/profile-forms";
import { isDemoAuth } from "@/config/env";
import { requireUser } from "@/server/auth/session";
import { getProfile } from "@/server/services/account";

export const metadata: Metadata = { title: "Minha conta", robots: { index: false } };

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ password?: string }> }) {
  const user = await requireUser();
  const [profile, sp] = await Promise.all([getProfile(user.id), searchParams]);
  return (
    <div className="space-y-14">
      {sp.password === "updated" && (
        <p role="status" className="border border-success/40 bg-success/5 px-4 py-3 text-[14px] text-success">Senha atualizada. Você já está conectado.</p>
      )}
      <section aria-labelledby="profile-title">
        <h2 id="profile-title" className="mb-6 text-[17px] font-semibold">Dados pessoais</h2>
        <ProfileForm email={user.email} defaults={{ fullName: profile?.fullName ?? "", phone: profile?.phone ?? "", cpf: profile?.cpf ?? "" }} />
      </section>
      <section aria-labelledby="password-title" className="border-t border-stone pt-10">
        <h2 id="password-title" className="mb-6 text-[17px] font-semibold">Senha</h2>
        <ChangePasswordForm requireCurrent={isDemoAuth} />
      </section>
    </div>
  );
}
