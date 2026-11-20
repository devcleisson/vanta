import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * VANTA database schema.
 * Money is always stored as integer cents (BRL) to avoid floating point errors.
 * The same schema runs on Supabase Postgres (production) and on embedded PGlite (demo mode).
 */

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const userRole = pgEnum("user_role", ["customer", "admin"]);
export const orderStatus = pgEnum("order_status", [
  "pending",
  "payment_approved",
  "preparing",
  "shipped",
  "delivered",
  "cancelled",
]);
export const paymentProvider = pgEnum("payment_provider", ["stripe", "simulated"]);
export const paymentStatus = pgEnum("payment_status", [
  "pending",
  "approved",
  "failed",
  "refunded",
  "expired",
]);
export const couponType = pgEnum("coupon_type", ["percent", "fixed", "free_shipping"]);
export const inventoryReason = pgEnum("inventory_reason", [
  "order",
  "cancel",
  "adjustment",
  "restock",
]);

/* ───────────────────────── Users ───────────────────────── */

/**
 * One row per account. In Supabase mode `id` equals `auth.users.id`
 * (created by a trigger, see supabase/policies.sql). In demo mode the app
 * manages credentials itself through `password_hash`.
 */
export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    fullName: text("full_name"),
    phone: text("phone"),
    cpf: text("cpf"),
    role: userRole("role").notNull().default("customer"),
    passwordHash: text("password_hash"),
    ...timestamps,
  },
  (t) => [uniqueIndex("profiles_email_idx").on(sql`lower(${t.email})`)],
);

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const addresses = pgTable(
  "addresses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    label: text("label").notNull().default("Casa"),
    recipient: text("recipient").notNull(),
    phone: text("phone"),
    cep: text("cep").notNull(),
    street: text("street").notNull(),
    number: text("number").notNull(),
    complement: text("complement"),
    district: text("district").notNull(),
    city: text("city").notNull(),
    state: text("state").notNull(),
    isDefault: boolean("is_default").notNull().default(false),
    ...timestamps,
  },
  (t) => [index("addresses_user_idx").on(t.userId)],
);

/* ───────────────────────── Catalog ───────────────────────── */

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  imageUrl: text("image_url"),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps,
});

export const sizes = pgTable("sizes", {
  id: uuid("id").primaryKey().defaultRandom(),
  label: text("label").notNull().unique(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const colors = pgTable("colors", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  hex: text("hex").notNull(),
});

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description").notNull(),
    details: jsonb("details").$type<string[]>().notNull().default([]),
    categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
    /** Regular price in cents. */
    price: integer("price").notNull(),
    /** Promotional price in cents. When set and lower than `price`, the product is on sale. */
    salePrice: integer("sale_price"),
    isFeatured: boolean("is_featured").notNull().default(false),
    isBestSeller: boolean("is_best_seller").notNull().default(false),
    isNew: boolean("is_new").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    salesCount: integer("sales_count").notNull().default(0),
    ...timestamps,
  },
  (t) => [
    index("products_category_idx").on(t.categoryId),
    index("products_created_idx").on(t.createdAt),
    index("products_active_idx").on(t.isActive),
  ],
);

export const productImages = pgTable(
  "product_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    colorId: uuid("color_id").references(() => colors.id, { onDelete: "set null" }),
    url: text("url").notNull(),
    alt: text("alt").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("product_images_product_idx").on(t.productId)],
);

/** A sellable unit (product × size × color). Stock lives here. */
export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    sizeId: uuid("size_id")
      .notNull()
      .references(() => sizes.id, { onDelete: "restrict" }),
    colorId: uuid("color_id")
      .notNull()
      .references(() => colors.id, { onDelete: "restrict" }),
    sku: text("sku").notNull().unique(),
    stock: integer("stock").notNull().default(0),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("variants_combo_idx").on(t.productId, t.sizeId, t.colorId),
    index("variants_product_idx").on(t.productId),
  ],
);

/** Audit trail for every stock change. */
export const inventoryMovements = pgTable(
  "inventory_movements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    delta: integer("delta").notNull(),
    reason: inventoryReason("reason").notNull(),
    orderId: uuid("order_id"),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("inventory_variant_idx").on(t.variantId)],
);

/* ───────────────────────── Cart & favorites ───────────────────────── */

export const carts = pgTable("carts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => profiles.id, { onDelete: "cascade" }),
  ...timestamps,
});

export const cartItems = pgTable(
  "cart_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cartId: uuid("cart_id")
      .notNull()
      .references(() => carts.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("cart_items_unique_idx").on(t.cartId, t.variantId)],
);

export const favorites = pgTable(
  "favorites",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.productId] })],
);

/* ───────────────────────── Commerce ───────────────────────── */

export const coupons = pgTable("coupons", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  description: text("description"),
  type: couponType("type").notNull(),
  /** Percent (1–100) for `percent`, cents for `fixed`, ignored for `free_shipping`. */
  value: integer("value").notNull().default(0),
  minSubtotal: integer("min_subtotal").notNull().default(0),
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").notNull().default(0),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  isActive: boolean("is_active").notNull().default(true),
  ...timestamps,
});

export type ShippingAddressSnapshot = {
  recipient: string;
  cep: string;
  street: string;
  number: string;
  complement?: string | null;
  district: string;
  city: string;
  state: string;
};

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    number: text("number").notNull().unique(),
    userId: uuid("user_id").references(() => profiles.id, { onDelete: "set null" }),
    /** Random secret that lets a guest open their own confirmation page. */
    accessToken: text("access_token").notNull(),
    status: orderStatus("status").notNull().default("pending"),
    email: text("email").notNull(),
    customerName: text("customer_name").notNull(),
    phone: text("phone").notNull(),
    cpf: text("cpf"),
    shippingAddress: jsonb("shipping_address").$type<ShippingAddressSnapshot>().notNull(),
    shippingMethod: text("shipping_method").notNull(),
    shippingDays: text("shipping_days"),
    subtotal: integer("subtotal").notNull(),
    discount: integer("discount").notNull().default(0),
    shippingCost: integer("shipping_cost").notNull().default(0),
    total: integer("total").notNull(),
    couponCode: text("coupon_code"),
    stockReleased: boolean("stock_released").notNull().default(false),
    ...timestamps,
  },
  (t) => [
    index("orders_user_idx").on(t.userId),
    index("orders_status_idx").on(t.status),
    index("orders_created_idx").on(t.createdAt),
    index("orders_email_idx").on(t.email),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
    variantId: uuid("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
    productName: text("product_name").notNull(),
    productSlug: text("product_slug").notNull(),
    imageUrl: text("image_url"),
    sizeLabel: text("size_label").notNull(),
    colorName: text("color_name").notNull(),
    sku: text("sku").notNull(),
    unitPrice: integer("unit_price").notNull(),
    quantity: integer("quantity").notNull(),
    lineTotal: integer("line_total").notNull(),
  },
  (t) => [index("order_items_order_idx").on(t.orderId), index("order_items_product_idx").on(t.productId)],
);

export const orderStatusHistory = pgTable(
  "order_status_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    status: orderStatus("status").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("order_history_order_idx").on(t.orderId)],
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    provider: paymentProvider("provider").notNull(),
    status: paymentStatus("status").notNull().default("pending"),
    amount: integer("amount").notNull(),
    providerReference: text("provider_reference"),
    isTest: boolean("is_test").notNull().default(true),
    ...timestamps,
  },
  (t) => [index("payments_order_idx").on(t.orderId), index("payments_ref_idx").on(t.providerReference)],
);

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ───────────────────────── Relations ───────────────────────── */

export const profilesRelations = relations(profiles, ({ many }) => ({
  addresses: many(addresses),
  orders: many(orders),
  favorites: many(favorites),
}));

export const addressesRelations = relations(addresses, ({ one }) => ({
  user: one(profiles, { fields: [addresses.userId], references: [profiles.id] }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  images: many(productImages),
  variants: many(productVariants),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, { fields: [productImages.productId], references: [products.id] }),
  color: one(colors, { fields: [productImages.colorId], references: [colors.id] }),
}));

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, { fields: [productVariants.productId], references: [products.id] }),
  size: one(sizes, { fields: [productVariants.sizeId], references: [sizes.id] }),
  color: one(colors, { fields: [productVariants.colorId], references: [colors.id] }),
}));

export const cartsRelations = relations(carts, ({ many, one }) => ({
  items: many(cartItems),
  user: one(profiles, { fields: [carts.userId], references: [profiles.id] }),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, { fields: [cartItems.cartId], references: [carts.id] }),
  variant: one(productVariants, { fields: [cartItems.variantId], references: [productVariants.id] }),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(profiles, { fields: [favorites.userId], references: [profiles.id] }),
  product: one(products, { fields: [favorites.productId], references: [products.id] }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(profiles, { fields: [orders.userId], references: [profiles.id] }),
  items: many(orderItems),
  history: many(orderStatusHistory),
  payments: many(payments),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));

export const orderStatusHistoryRelations = relations(orderStatusHistory, ({ one }) => ({
  order: one(orders, { fields: [orderStatusHistory.orderId], references: [orders.id] }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, { fields: [payments.orderId], references: [orders.id] }),
}));
