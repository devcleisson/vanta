import bcrypt from "bcryptjs";
import { count, eq } from "drizzle-orm";
import { isDemoAuth } from "@/config/env";
import type { Database } from "./client";
import * as s from "./schema";
import {
  productImagePath,
  seedCategories,
  seedColors,
  seedCoupons,
  seedProducts,
  seedSizes,
  seedStock,
} from "./seed-data";

export const DEMO_ADMIN = { email: "admin@vanta.store", password: "vanta-admin", name: "Admin VANTA" };
export const DEMO_CUSTOMER = { email: "cliente@vanta.store", password: "vanta1234", name: "Marina Costa" };

const DAY = 24 * 60 * 60 * 1000;

/** Inserts the full demo catalog. Idempotent per slug/code. */
export async function seedCatalog(db: Database) {
  await db.transaction(async (tx) => {
    const cats = await tx
      .insert(s.categories)
      .values(seedCategories.map((c) => ({ ...c, imageUrl: null })))
      .onConflictDoNothing()
      .returning();
    const allCats = cats.length ? cats : await tx.select().from(s.categories);

    await tx.insert(s.sizes).values([...seedSizes]).onConflictDoNothing();
    await tx.insert(s.colors).values([...seedColors]).onConflictDoNothing();
    const sizes = await tx.select().from(s.sizes);
    const colors = await tx.select().from(s.colors);

    for (const [pi, p] of seedProducts.entries()) {
      const exists = await tx.select({ id: s.products.id }).from(s.products).where(eq(s.products.slug, p.slug));
      if (exists.length) continue;
      const category = allCats.find((c) => c.slug === p.category);
      const createdAt = new Date(Date.now() - p.ageDays * DAY);
      const [product] = await tx
        .insert(s.products)
        .values({
          name: p.name,
          slug: p.slug,
          description: p.description,
          details: p.details,
          categoryId: category?.id ?? null,
          price: p.price,
          salePrice: p.salePrice ?? null,
          isNew: Boolean(p.isNew),
          isBestSeller: Boolean(p.isBestSeller),
          isFeatured: Boolean(p.isFeatured),
          salesCount: p.salesCount,
          createdAt,
          updatedAt: createdAt,
        })
        .returning();

      let order = 0;
      for (const [ci, colorSlug] of p.colors.entries()) {
        const color = colors.find((c) => c.slug === colorSlug)!;
        await tx.insert(s.productImages).values([
          { productId: product.id, colorId: color.id, url: productImagePath(p.slug, colorSlug, "front"), alt: `${p.name} ${color.name} — frente`, sortOrder: order++ },
          { productId: product.id, colorId: color.id, url: productImagePath(p.slug, colorSlug, "back"), alt: `${p.name} ${color.name} — costas`, sortOrder: order++ },
        ]);
        for (const [si, sizeLabel] of p.sizes.entries()) {
          const size = sizes.find((sz) => sz.label === sizeLabel)!;
          await tx.insert(s.productVariants).values({
            productId: product.id,
            sizeId: size.id,
            colorId: color.id,
            sku: `VNT-${p.slug.replace("vanta-", "").toUpperCase()}-${colorSlug.toUpperCase().slice(0, 3)}-${sizeLabel === "Único" ? "UN" : sizeLabel}`,
            stock: seedStock(pi, ci, si),
          });
        }
      }
    }

    // Category covers: the first image of the best-selling product of each category.
    for (const c of seedCategories) {
      const rep = seedProducts.filter((p) => p.category === c.slug).sort((a, b) => b.salesCount - a.salesCount)[0];
      if (rep) {
        await tx
          .update(s.categories)
          .set({ imageUrl: productImagePath(rep.slug, rep.colors[0], "front") })
          .where(eq(s.categories.slug, c.slug));
      }
    }

    await tx
      .insert(s.coupons)
      .values(seedCoupons.map((c) => ({ ...c })))
      .onConflictDoNothing();
  });
}

/** Demo-mode accounts (local auth only). Supabase projects create users through Supabase Auth. */
export async function seedDemoAccounts(db: Database) {
  if (!isDemoAuth) return;
  for (const acc of [
    { ...DEMO_ADMIN, role: "admin" as const },
    { ...DEMO_CUSTOMER, role: "customer" as const },
  ]) {
    await db
      .insert(s.profiles)
      .values({
        email: acc.email,
        fullName: acc.name,
        role: acc.role,
        passwordHash: await bcrypt.hash(acc.password, 10),
      })
      .onConflictDoNothing();
  }
}

export async function seedIfEmpty(db: Database) {
  const [{ value }] = await db.select({ value: count() }).from(s.products);
  if (value === 0) {
    await seedCatalog(db);
    await seedDemoAccounts(db);
  }
}
