import "server-only";
import { and, asc, desc, eq, ne } from "drizzle-orm";
import { getDb, schema as s } from "@/server/db/client";

export async function getProfile(userId: string) {
  const db = await getDb();
  const [profile] = await db.select().from(s.profiles).where(eq(s.profiles.id, userId));
  return profile ?? null;
}

export async function updateProfile(userId: string, data: { fullName: string; phone: string; cpf: string }) {
  const db = await getDb();
  await db
    .update(s.profiles)
    .set({ fullName: data.fullName, phone: data.phone || null, cpf: data.cpf || null })
    .where(eq(s.profiles.id, userId));
}

export async function listAddresses(userId: string) {
  const db = await getDb();
  return db
    .select()
    .from(s.addresses)
    .where(eq(s.addresses.userId, userId))
    .orderBy(desc(s.addresses.isDefault), asc(s.addresses.createdAt));
}

type AddressData = Omit<typeof s.addresses.$inferInsert, "id" | "userId" | "createdAt" | "updatedAt">;

export async function saveAddress(userId: string, data: AddressData, id?: string) {
  const db = await getDb();
  await db.transaction(async (tx) => {
    const others = await tx.select({ id: s.addresses.id }).from(s.addresses).where(eq(s.addresses.userId, userId));
    const makeDefault = data.isDefault || others.filter((o) => o.id !== id).length === 0;
    let savedId = id;
    if (id) {
      const updated = await tx
        .update(s.addresses)
        .set({ ...data, isDefault: makeDefault })
        .where(and(eq(s.addresses.id, id), eq(s.addresses.userId, userId)))
        .returning({ id: s.addresses.id });
      if (!updated.length) throw new Error("Endereço não encontrado.");
    } else {
      const [row] = await tx.insert(s.addresses).values({ ...data, userId, isDefault: makeDefault }).returning({ id: s.addresses.id });
      savedId = row.id;
    }
    if (makeDefault) {
      await tx
        .update(s.addresses)
        .set({ isDefault: false })
        .where(and(eq(s.addresses.userId, userId), ne(s.addresses.id, savedId!)));
    }
  });
}

export async function deleteAddress(userId: string, id: string) {
  const db = await getDb();
  await db.transaction(async (tx) => {
    const [removed] = await tx
      .delete(s.addresses)
      .where(and(eq(s.addresses.id, id), eq(s.addresses.userId, userId)))
      .returning();
    if (removed?.isDefault) {
      const [next] = await tx.select().from(s.addresses).where(eq(s.addresses.userId, userId)).limit(1);
      if (next) await tx.update(s.addresses).set({ isDefault: true }).where(eq(s.addresses.id, next.id));
    }
  });
}

export async function subscribeNewsletter(email: string) {
  const db = await getDb();
  const rows = await db.insert(s.newsletterSubscribers).values({ email }).onConflictDoNothing().returning();
  return rows.length > 0;
}
