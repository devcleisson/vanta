import "server-only";
import { and, asc, count, desc, eq, ilike, inArray, notInArray, or, sql, type SQL } from "drizzle-orm";
import { siteConfig } from "@/config/site";
import { getDb, schema as s } from "@/server/db/client";
import type { ProductFormData } from "@/schemas/admin";

const toCents = (reais: number) => Math.round(Number(reais) * 100);

/* ───────────── Products ───────────── */

export async function listAdminProducts(filters: { q?: string; category?: string; status?: string; stock?: string }) {
  const db = await getDb();
  const where: SQL[] = [];
  if (filters.q) where.push(or(ilike(s.products.name, `%${filters.q}%`), ilike(s.products.slug, `%${filters.q}%`))!);
  if (filters.category) where.push(eq(s.categories.slug, filters.category));
  if (filters.status === "active") where.push(eq(s.products.isActive, true));
  if (filters.status === "inactive") where.push(eq(s.products.isActive, false));
  if (filters.status === "sale") where.push(sql`${s.products.salePrice} is not null and ${s.products.salePrice} < ${s.products.price}`);

  const stockSum = sql<number>`coalesce((select sum(v.stock) from product_variants v where v.product_id = "products"."id"), 0)::int`;
  const lowCount = sql<number>`(select count(*) from product_variants v where v.product_id = "products"."id" and v.stock <= ${siteConfig.lowStockThreshold})::int`;
  if (filters.stock === "low") where.push(sql`${lowCount} > 0`);
  if (filters.stock === "out") where.push(sql`${stockSum} = 0`);

  return db
    .select({
      id: s.products.id,
      name: s.products.name,
      slug: s.products.slug,
      price: s.products.price,
      salePrice: s.products.salePrice,
      isActive: s.products.isActive,
      isNew: s.products.isNew,
      isBestSeller: s.products.isBestSeller,
      isFeatured: s.products.isFeatured,
      salesCount: s.products.salesCount,
      category: s.categories.name,
      stock: stockSum,
      lowVariants: lowCount,
      image: sql<string | null>`(select i.url from product_images i where i.product_id = "products"."id" order by i.sort_order limit 1)`,
      updatedAt: s.products.updatedAt,
    })
    .from(s.products)
    .leftJoin(s.categories, eq(s.categories.id, s.products.categoryId))
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(s.products.updatedAt));
}

export async function getAdminProduct(id: string) {
  const db = await getDb();
  return db.query.products.findFirst({
    where: eq(s.products.id, id),
    with: { images: { orderBy: asc(s.productImages.sortOrder) }, variants: true },
  });
}

export async function getProductFormOptions() {
  const db = await getDb();
  const [categories, sizes, colors] = await Promise.all([
    db.select().from(s.categories).orderBy(asc(s.categories.sortOrder)),
    db.select().from(s.sizes).orderBy(asc(s.sizes.sortOrder)),
    db.select().from(s.colors).orderBy(asc(s.colors.name)),
  ]);
  return { categories, sizes, colors };
}

/** Creates or updates a product with its variants and images in one transaction. */
export async function saveProduct(data: ProductFormData, id?: string) {
  const db = await getDb();
  return db.transaction(async (tx) => {
    const [slugTaken] = await tx
      .select({ id: s.products.id })
      .from(s.products)
      .where(and(eq(s.products.slug, data.slug), id ? sql`${s.products.id} <> ${id}` : undefined));
    if (slugTaken) throw new Error("Já existe um produto com esta URL. Escolha outra.");

    const skus = data.variants.map((v) => v.sku.toUpperCase());
    const skuTaken = await tx
      .select({ sku: s.productVariants.sku })
      .from(s.productVariants)
      .where(and(inArray(sql`upper(${s.productVariants.sku})`, skus), id ? sql`${s.productVariants.productId} <> ${id}` : undefined));
    if (skuTaken.length) throw new Error(`O SKU ${skuTaken[0].sku} já está em uso por outro produto.`);

    const saleCents = data.salePrice === "" || data.salePrice == null ? 0 : toCents(Number(data.salePrice));
    const sale = saleCents > 0 ? saleCents : null;
    const values = {
      name: data.name,
      slug: data.slug,
      description: data.description,
      details: (data.details ?? "").split("\n").map((l) => l.trim()).filter(Boolean),
      categoryId: data.categoryId,
      price: toCents(data.price),
      salePrice: sale,
      isActive: data.isActive,
      isNew: data.isNew,
      isBestSeller: data.isBestSeller,
      isFeatured: data.isFeatured,
    };

    let productId = id;
    if (id) {
      const updated = await tx.update(s.products).set(values).where(eq(s.products.id, id)).returning({ id: s.products.id });
      if (!updated.length) throw new Error("Produto não encontrado.");
    } else {
      const [row] = await tx.insert(s.products).values(values).returning({ id: s.products.id });
      productId = row.id;
    }

    // Variants: upsert by (size, colour) so existing ids (carts, orders) are preserved.
    const existing = await tx.select().from(s.productVariants).where(eq(s.productVariants.productId, productId!));
    const keep: string[] = [];
    for (const v of data.variants) {
      const match = existing.find((e) => e.sizeId === v.sizeId && e.colorId === v.colorId);
      if (match) {
        keep.push(match.id);
        if (match.stock !== v.stock) {
          await tx.insert(s.inventoryMovements).values({
            variantId: match.id,
            delta: v.stock - match.stock,
            reason: v.stock > match.stock ? "restock" : "adjustment",
            note: "Ajuste manual no painel",
          });
        }
        await tx.update(s.productVariants).set({ sku: v.sku.toUpperCase(), stock: v.stock }).where(eq(s.productVariants.id, match.id));
      } else {
        const [row] = await tx
          .insert(s.productVariants)
          .values({ productId: productId!, sizeId: v.sizeId, colorId: v.colorId, sku: v.sku.toUpperCase(), stock: v.stock })
          .returning({ id: s.productVariants.id });
        keep.push(row.id);
        if (v.stock > 0) await tx.insert(s.inventoryMovements).values({ variantId: row.id, delta: v.stock, reason: "restock", note: "Estoque inicial" });
      }
    }
    await tx
      .delete(s.productVariants)
      .where(and(eq(s.productVariants.productId, productId!), keep.length ? notInArray(s.productVariants.id, keep) : undefined));

    // Images: replace the ordered list.
    await tx.delete(s.productImages).where(eq(s.productImages.productId, productId!));
    if (data.images.length) {
      await tx.insert(s.productImages).values(
        data.images.map((img, i) => ({
          productId: productId!,
          url: img.url,
          alt: img.alt || data.name,
          colorId: img.colorId ?? null,
          sortOrder: i,
        })),
      );
    }
    return productId!;
  });
}

export async function deleteProduct(id: string) {
  const db = await getDb();
  await db.delete(s.products).where(eq(s.products.id, id));
}

export async function setProductFlag(id: string, flag: "isActive" | "isNew" | "isBestSeller" | "isFeatured", value: boolean) {
  const db = await getDb();
  await db.update(s.products).set({ [flag]: value }).where(eq(s.products.id, id));
}

/* ───────────── Categories, sizes, colours ───────────── */

export async function listCategoriesWithCounts() {
  const db = await getDb();
  return db
    .select({
      id: s.categories.id,
      name: s.categories.name,
      slug: s.categories.slug,
      description: s.categories.description,
      imageUrl: s.categories.imageUrl,
      sortOrder: s.categories.sortOrder,
      products: sql<number>`(select count(*) from products p where p.category_id = "categories"."id")::int`,
    })
    .from(s.categories)
    .orderBy(asc(s.categories.sortOrder));
}

export async function saveCategory(data: { name: string; slug: string; description?: string; imageUrl?: string; sortOrder: number }, id?: string) {
  const db = await getDb();
  const [taken] = await db
    .select({ id: s.categories.id })
    .from(s.categories)
    .where(and(eq(s.categories.slug, data.slug), id ? sql`${s.categories.id} <> ${id}` : undefined));
  if (taken) throw new Error("Já existe uma categoria com esta URL.");
  const values = { ...data, description: data.description || null, imageUrl: data.imageUrl || null };
  if (id) await db.update(s.categories).set(values).where(eq(s.categories.id, id));
  else await db.insert(s.categories).values(values);
}

export async function deleteCategory(id: string) {
  const db = await getDb();
  await db.delete(s.categories).where(eq(s.categories.id, id));
}

export async function listAttributes() {
  const db = await getDb();
  const [sizes, colors] = await Promise.all([
    db
      .select({
        id: s.sizes.id,
        label: s.sizes.label,
        sortOrder: s.sizes.sortOrder,
        used: sql<number>`(select count(*) from product_variants v where v.size_id = "sizes"."id")::int`,
      })
      .from(s.sizes)
      .orderBy(asc(s.sizes.sortOrder)),
    db
      .select({
        id: s.colors.id,
        name: s.colors.name,
        slug: s.colors.slug,
        hex: s.colors.hex,
        used: sql<number>`(select count(*) from product_variants v where v.color_id = "colors"."id")::int`,
      })
      .from(s.colors)
      .orderBy(asc(s.colors.name)),
  ]);
  return { sizes, colors };
}

export async function saveSize(data: { label: string; sortOrder: number }, id?: string) {
  const db = await getDb();
  const [taken] = await db.select({ id: s.sizes.id }).from(s.sizes).where(and(eq(s.sizes.label, data.label), id ? sql`${s.sizes.id} <> ${id}` : undefined));
  if (taken) throw new Error("Este tamanho já existe.");
  if (id) await db.update(s.sizes).set(data).where(eq(s.sizes.id, id));
  else await db.insert(s.sizes).values(data);
}

export async function saveColor(data: { name: string; hex: string; slug: string }, id?: string) {
  const db = await getDb();
  const [taken] = await db.select({ id: s.colors.id }).from(s.colors).where(and(eq(s.colors.slug, data.slug), id ? sql`${s.colors.id} <> ${id}` : undefined));
  if (taken) throw new Error("Já existe uma cor com este nome.");
  if (id) await db.update(s.colors).set(data).where(eq(s.colors.id, id));
  else await db.insert(s.colors).values(data);
}

async function assertUnused(column: "sizeId" | "colorId", id: string, label: string) {
  const db = await getDb();
  const [{ n }] = await db.select({ n: count() }).from(s.productVariants).where(eq(s.productVariants[column], id));
  if (n > 0) throw new Error(`${label} está em uso por ${n} variante(s). Remova dos produtos antes de excluir.`);
}

export async function deleteSize(id: string) {
  await assertUnused("sizeId", id, "Este tamanho");
  const db = await getDb();
  await db.delete(s.sizes).where(eq(s.sizes.id, id));
}

export async function deleteColor(id: string) {
  await assertUnused("colorId", id, "Esta cor");
  const db = await getDb();
  await db.delete(s.colors).where(eq(s.colors.id, id));
}

/* ───────────── Coupons ───────────── */

export async function listCoupons() {
  const db = await getDb();
  return db.select().from(s.coupons).orderBy(desc(s.coupons.createdAt));
}

export async function saveCoupon(
  data: { code: string; description?: string; type: "percent" | "fixed" | "free_shipping"; value: number; minSubtotal: number; maxUses?: number | "" | null; expiresAt?: string; isActive: boolean },
  id?: string,
) {
  const db = await getDb();
  const [taken] = await db
    .select({ id: s.coupons.id })
    .from(s.coupons)
    .where(and(sql`upper(${s.coupons.code}) = ${data.code.toUpperCase()}`, id ? sql`${s.coupons.id} <> ${id}` : undefined));
  if (taken) throw new Error("Já existe um cupom com este código.");
  const values = {
    code: data.code.toUpperCase(),
    description: data.description || null,
    type: data.type,
    value: data.type === "fixed" ? toCents(data.value) : data.type === "percent" ? Math.round(data.value) : 0,
    minSubtotal: toCents(data.minSubtotal),
    maxUses: data.maxUses === "" || data.maxUses == null ? null : Number(data.maxUses),
    expiresAt: data.expiresAt ? new Date(`${data.expiresAt}T23:59:59-03:00`) : null,
    isActive: data.isActive,
  };
  if (id) await db.update(s.coupons).set(values).where(eq(s.coupons.id, id));
  else await db.insert(s.coupons).values(values);
}

export async function deleteCoupon(id: string) {
  const db = await getDb();
  await db.delete(s.coupons).where(eq(s.coupons.id, id));
}
