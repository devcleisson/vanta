import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/auth-forms";
import { isDemoAuth } from "@/config/env";
import { getCurrentUser } from "@/server/auth/session";
import { DEMO_ADMIN, DEMO_CUSTOMER } from "@/server/db/seed";

export const metadata: Metadata = { title: "Entrar", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await getCurrentUser()) redirect(next?.startsWith("/") ? next : "/account");
  return (
    <>
      <h1 className="display text-[clamp(2.5rem,8vw,4rem)]">Sign in</h1>
      <p className="mb-8 mt-3 text-[15px] text-graphite">
        Ainda não tem conta?{" "}
        <Link href={`/register${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-ink underline underline-offset-4">Crie agora</Link>
      </p>
      <LoginForm
        next={next}
        demoHint={
          isDemoAuth
            ? { admin: DEMO_ADMIN.email, adminPassword: DEMO_ADMIN.password, customer: DEMO_CUSTOMER.email, password: DEMO_CUSTOMER.password }
            : undefined
        }
      />
    </>
  );
}
