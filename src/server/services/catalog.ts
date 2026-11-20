import "server-only";
import { and, asc, count, desc, eq, exists, gt, ilike, inArray, ne, or, sql, type SQL } from "drizzle-orm";
import { getDb, schema as s } from "@/server/db/client";
import type {
  CatalogQuery,
  ColorOption,
  ProductCardData,
  ProductDetailData,
  SizeOption,
} from "@/types/catalog";

const effectivePriceSql = sql<number>`case when ${s.products.salePrice} is not null and ${s.products.salePrice} > 0 and ${s.products.salePrice} < ${s.products.price} then ${s.products.salePrice} else ${s.products.price} end`;

export async function listCategories() {
  const db = await getDb();
  return db.select().from(s.categories).orderBy(asc(s.categories.sortOrder), asc(s.categories.name));
}

export async function getCategoryBySlug(slug: string) {
  const db = await getDb();
  const [category] = await db.select().from(s.categories).where(eq(s.categories.slug, slug));
  return category ?? null;
}

/** Sizes, colours and price bounds actually present in the active catalogue. */
export async function getFilterOptions() {
  const db = await getDb();
  const activeVariant = and(eq(s.products.isActive, true));
  const [sizes, colors, [bounds]] = await Promise.all([
    db
      .selectDistinct({ id: s.sizes.id, label: s.sizes.label, sortOrder: s.sizes.sortOrder })
      .from(s.sizes)
      .innerJoin(s.productVariants, eq(s.productVariants.sizeId, s.sizes.id))
      .innerJoin(s.products, eq(s.products.id, s.productVariants.productId))
      .where(activeVariant)
      .orderBy(asc(s.sizes.sortOrder)),
    db
      .selectDistinct({ id: s.colors.id, name: s.colors.name, slug: s.colors.slug, hex: s.colors.hex })
      .from(s.colors)
      .innerJoin(s.productVariants, eq(s.productVariants.colorId, s.colors.id))
      .innerJoin(s.products, eq(s.products.id, s.productVariants.productId))
      .where(activeVariant)
      .orderBy(asc(s.colors.name)),
    db
      .select({ min: sql<number>`coalesce(min(${effectivePriceSql}), 0)`, max: sql<number>`coalesce(max(${effectivePriceSql}), 0)` })
      .from(s.products)
      .where(eq(s.products.isActive, true)),
  ]);
  return {
    sizes: sizes as SizeOption[],
    colors: colors as ColorOption[],
    priceRange: { min: Number(bounds.min), max: Number(bounds.max) },
  };
}

/** Hydrates product rows into card data (images, colours, stock) with three batched queries. */
async function toCards(rows: (typeof s.products.$inferSelect & { categoryName: string | null; categorySlug: string | null })[]) {
  if (!rows.length) return [];
  const db = await getDb();
  const ids = rows.map((r) => r.id);
  const [images, variants] = await Promise.all([
    db
      .select()
      .from(s.productImages)
      .where(inArray(s.productImages.productId, ids))
      .orderBy(asc(s.productImages.sortOrder)),
    db
      .select({
        id: s.productVariants.id,
        productId: s.productVariants.productId,
        stock: s.productVariants.stock,
        colorId: s.colors.id,
        colorName: s.colors.name,
        colorSlug: s.colors.slug,
        colorHex: s.colors.hex,
      })
      .from(s.productVariants)
      .innerJoin(s.colors, eq(s.colors.id, s.productVariants.colorId))
      .where(inArray(s.productVariants.productId, ids)),
  ]);

  return rows.map<ProductCardData>((r) => {
    const imgs = images.filter((i) => i.productId === r.id);
    const vs = variants.filter((v) => v.productId === r.id);
    const colors: ColorOption[] = [];
    for (const v of vs) {
      if (!colors.some((c) => c.id === v.colorId)) {
        colors.push({ id: v.colorId, name: v.colorName, slug: v.colorSlug, hex: v.colorHex });
      }
    }
    // Primary colour = colour of the first image; hover = second image of that colour.
    const first = imgs[0];
    const sameColor = first ? imgs.filter((i) => i.colorId === first.colorId) : [];
    const hover = sameColor[1] ?? imgs[1] ?? null;
    return {
      id: r.id,
      slug: r.slug,
      name: r.name,
      price: r.price,
      salePrice: r.salePrice,
      isNew: r.isNew,
      isBestSeller: r.isBestSeller,
      category: r.categorySlug ? { name: r.categoryName!, slug: r.categorySlug } : null,
      image: first ? { url: first.url, alt: first.alt || r.name } : null,
      hoverImage: hover ? { url: hover.url, alt: hover.alt || r.name } : null,
      colors,
      inStock: vs.some((v) => v.stock > 0),
      singleVariantId: vs.length === 1 ? vs[0].id : null,
    };
  });
}

async function selectCards(where: SQL | undefined, order: SQL[], limit: number, offset = 0) {
  const db = await getDb();
  const rows = await db
    .select({
      product: s.products,
      categoryName: s.categories.name,
      categorySlug: s.categories.slug,
    })
    .from(s.products)
    .leftJoin(s.categories, eq(s.categories.id, s.products.categoryId))
    .where(where)
    .orderBy(...order)
    .limit(limit)
    .offset(offset);
  return toCards(rows.map((r) => ({ ...r.product, categoryName: r.categoryName, categorySlug: r.categorySlug })));
}

export async function searchProducts(query: CatalogQuery) {
  const db = await getDb();
  const perPage = Math.min(query.perPage ?? 24, 60);
  const page = Math.max(query.page ?? 1, 1);

  const conditions: SQL[] = [eq(s.products.isActive, true)];

  if (query.q?.trim()) {
    const term = `%${query.q.trim().replace(/[%_]/g, "")}%`;
    conditions.push(
      or(ilike(s.products.name, term), ilike(s.products.description, term), ilike(s.categories.name, term))!,
    );
  }
  if (query.category) conditions.push(eq(s.categories.slug, query.category));
  if (query.isNew) conditions.push(eq(s.products.isNew, true));
  if (query.onSale) conditions.push(sql`${effectivePriceSql} < ${s.products.price}`);
  if (query.minPrice != null) conditions.push(sql`${effectivePriceSql} >= ${query.minPrice}`);
  if (query.maxPrice != null) conditions.push(sql`${effectivePriceSql} <= ${query.maxPrice}`);

  // Size / colour / availability are evaluated together on the same variant,
  // so "M + Black + in stock" means a black M that is actually in stock.
  if (query.sizes?.length || query.colors?.length || query.inStock) {
    const v = [eq(s.productVariants.productId, s.products.id)];
    if (query.sizes?.length) v.push(inArray(s.sizes.label, query.sizes));
    if (query.colors?.length) v.push(inArray(s.colors.slug, query.colors));
    if (query.inStock) v.push(gt(s.productVariants.stock, 0));
    conditions.push(
      exists(
        db
          .select({ one: sql`1` })
          .from(s.productVariants)
          .innerJoin(s.sizes, eq(s.sizes.id, s.productVariants.sizeId))
          .innerJoin(s.colors, eq(s.colors.id, s.productVariants.colorId))
          .where(and(...v)),
      ),
    );
  }

  const where = and(...conditions);
  const order: SQL[] =
    query.sort === "price-asc"
      ? [asc(effectivePriceSql), asc(s.products.name)]
      : query.sort === "price-desc"
        ? [desc(effectivePriceSql), asc(s.products.name)]
        : query.sort === "best-sellers"
          ? [desc(s.products.salesCount), desc(s.products.createdAt)]
          : [desc(s.products.createdAt), asc(s.products.name)];

  const [[{ total }], items] = await Promise.all([
    db
      .select({ total: count() })
      .from(s.products)
      .leftJoin(s.categories, eq(s.categories.id, s.products.categoryId))
      .where(where),
    selectCards(where, order, perPage, (page - 1) * perPage),
  ]);

  return { items, total, page, perPage, pageCount: Math.max(1, Math.ceil(total / perPage)) };
}

export async function getNewArrivals(limit = 8) {
  return selectCards(eq(s.products.isActive, true), [desc(s.products.isNew), desc(s.products.createdAt)], limit);
}

export async function getBestSellers(limit = 8) {
  return selectCards(
    eq(s.products.isActive, true),
    [desc(s.products.isBestSeller), desc(s.products.salesCount)],
    limit,
  );
}

export async function getFeatured(limit = 4) {
  return selectCards(
    and(eq(s.products.isActive, true), eq(s.products.isFeatured, true)),
    [desc(s.products.createdAt)],
    limit,
  );
}

export async function getProductsByIds(ids: string[]) {
  const clean = ids.filter((id) => /^[0-9a-f-]{36}$/i.test(id)).slice(0, 100);
  if (!clean.length) return [];
  const cards = await selectCards(
    and(eq(s.products.isActive, true), inArray(s.products.id, clean)),
    [desc(s.products.createdAt)],
    100,
  );
  return clean.map((id) => cards.find((c) => c.id === id)).filter(Boolean) as ProductCardData[];
}

export async function getProductBySlug(slug: string): Promise<ProductDetailData | null> {
  const db = await getDb();
  const product = await db.query.products.findFirst({
    where: and(eq(s.products.slug, slug), eq(s.products.isActive, true)),
    with: {
      category: true,
      images: { orderBy: asc(s.productImages.sortOrder) },
      variants: { with: { size: true, color: true } },
    },
  });
  if (!product) return null;

  const colors: ColorOption[] = [];
  const sizes: SizeOption[] = [];
  for (const v of product.variants) {
    if (!colors.some((c) => c.id === v.color.id)) colors.push({ id: v.color.id, name: v.color.name, slug: v.color.slug, hex: v.color.hex });
    if (!sizes.some((x) => x.id === v.size.id)) sizes.push({ id: v.size.id, label: v.size.label, sortOrder: v.size.sortOrder });
  }
  sizes.sort((a, b) => a.sortOrder - b.sortOrder);
  // Keep colours in the order of their first image (matches the gallery).
  colors.sort((a, b) => {
    const ia = product.images.findIndex((i) => i.colorId === a.id);
    const ib = product.images.findIndex((i) => i.colorId === b.id);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    salePrice: product.salePrice,
    isNew: product.isNew,
    isBestSeller: product.isBestSeller,
    category: product.category ? { name: product.category.name, slug: product.category.slug } : null,
    colors,
    inStock: product.variants.some((v) => v.stock > 0),
    description: product.description,
    details: product.details ?? [],
    images: product.images.map((i) => ({ id: i.id, url: i.url, alt: i.alt || product.name, colorId: i.colorId })),
    sizes,
    variants: product.variants.map((v) => ({ id: v.id, sku: v.sku, stock: v.stock, sizeId: v.sizeId, colorId: v.colorId })),
    salesCount: product.salesCount,
    createdAt: product.createdAt.toISOString(),
  };
}

export async function getRelatedProducts(product: { id: string; category: { slug: string } | null }, limit = 4) {
  const db = await getDb();
  if (!product.category) return [];
  const [cat] = await db.select({ id: s.categories.id }).from(s.categories).where(eq(s.categories.slug, product.category.slug));
  if (!cat) return [];
  return selectCards(
    and(eq(s.products.isActive, true), eq(s.products.categoryId, cat.id), ne(s.products.id, product.id)),
    [desc(s.products.salesCount)],
    limit,
  );
}

/** "Complete the look": best sellers from other categories. */
export async function getSuggestions(product: { id: string; category: { slug: string } | null }, limit = 4) {
  const db = await getDb();
  const [cat] = product.category
    ? await db.select({ id: s.categories.id }).from(s.categories).where(eq(s.categories.slug, product.category.slug))
    : [];
  return selectCards(
    and(
      eq(s.products.isActive, true),
      ne(s.products.id, product.id),
      cat ? sql`${s.products.categoryId} is distinct from ${cat.id}` : undefined,
    ),
    [desc(s.products.isFeatured), desc(s.products.salesCount)],
    limit,
  );
}

export async function getAllProductSlugs() {
  const db = await getDb();
  return db
    .select({ slug: s.products.slug, updatedAt: s.products.updatedAt })
    .from(s.products)
    .where(eq(s.products.isActive, true));
}
