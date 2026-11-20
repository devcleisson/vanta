import { isDemoAuth } from "@/config/env";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-x flex justify-center pb-24 pt-12 md:pt-20">
      <div className="w-full max-w-md">
        {children}
        {isDemoAuth && (
          <p className="mt-10 border-t border-stone pt-5 text-[12px] leading-relaxed text-smoke">
            Modo demonstração: as contas ficam no banco local deste projeto. Configure o Supabase para usar autenticação real
            com confirmação por e-mail.
          </p>
        )}
      </div>
    </div>
  );
}
