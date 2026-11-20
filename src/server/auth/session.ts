import "server-only";
import { eq, sql } from "drizzle-orm";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { env, features } from "@/config/env";
import { getDb, schema } from "@/server/db/client";
import { createSupabaseServerClient } from "@/server/supabase/server";

export const DEMO_SESSION_COOKIE = "vanta_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const secret = new TextEncoder().encode(env.authSecret);

export type SessionUser = {
  id: string;
  email: string;
  fullName: string | null;
  role: "customer" | "admin";
};

/* ───────────── Demo (local) sessions ───────────── */

export async function createDemoSession(userId: string) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secret);
  const store = await cookies();
  store.set(DEMO_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroyDemoSession() {
  (await cookies()).delete(DEMO_SESSION_COOKIE);
}

async function demoUserId(): Promise<string | null> {
  const token = (await cookies()).get(DEMO_SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

/* ───────────── Supabase sessions ───────────── */

async function supabaseUser(): Promise<{ id: string; email: string; fullName: string | null } | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user?.email) return null;
  return {
    id: data.user.id,
    email: data.user.email,
    fullName: (data.user.user_metadata?.full_name as string | undefined) ?? null,
  };
}

/* ───────────── Public API ───────────── */

/**
 * Returns the signed-in user, or null. Role always comes from the database,
 * never from the cookie, so revoking admin access takes effect immediately.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const db = await getDb();

  if (features.supabaseAuth) {
    const auth = await supabaseUser();
    if (!auth) return null;
    let [profile] = await db.select().from(schema.profiles).where(eq(schema.profiles.id, auth.id));
    if (!profile) {
      // Fallback when the auth trigger from supabase/policies.sql is not installed.
      [profile] = await db
        .insert(schema.profiles)
        .values({ id: auth.id, email: auth.email, fullName: auth.fullName })
        .onConflictDoUpdate({ target: schema.profiles.id, set: { email: auth.email } })
        .returning();
    }
    return { id: profile.id, email: profile.email, fullName: profile.fullName, role: profile.role };
  }

  const id = await demoUserId();
  if (!id) return null;
  const [profile] = await db.select().from(schema.profiles).where(eq(schema.profiles.id, id));
  if (!profile) return null;
  return { id: profile.id, email: profile.email, fullName: profile.fullName, role: profile.role };
});

export async function requireUser(next = "/account") {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "admin") redirect("/?denied=admin");
  return user;
}

/** For server actions: throws instead of redirecting. */
export async function assertAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") throw new Error("Acesso restrito a administradores.");
  return user;
}

export async function findProfileByEmail(email: string) {
  const db = await getDb();
  const [profile] = await db
    .select()
    .from(schema.profiles)
    .where(sql`lower(${schema.profiles.email}) = ${email.toLowerCase()}`);
  return profile ?? null;
}
