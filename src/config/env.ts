/**
 * Centralised, validated access to environment variables.
 *
 * Every integration is optional. Missing credentials switch the app into a
 * documented demo mode instead of crashing:
 *  - no DATABASE_URL           → embedded PGlite database stored in ./.data
 *  - no Supabase keys          → local auth (bcrypt + signed cookie) and local image uploads
 *  - no Stripe keys            → simulated checkout, clearly labelled, no charge is made
 *
 * Never import this file from client components: it reads server-only secrets.
 */

function read(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value.trim() : undefined;
}

export const env = {
  siteUrl: read("NEXT_PUBLIC_SITE_URL") ?? "http://localhost:3000",
  databaseUrl: read("DATABASE_URL"),
  pgliteDir: read("PGLITE_DIR") ?? ".data/pglite",

  supabaseUrl: read("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: read("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceRoleKey: read("SUPABASE_SERVICE_ROLE_KEY"),
  supabaseStorageBucket: read("SUPABASE_STORAGE_BUCKET") ?? "product-images",

  stripeSecretKey: read("STRIPE_SECRET_KEY"),
  stripeWebhookSecret: read("STRIPE_WEBHOOK_SECRET"),

  authSecret: read("AUTH_SECRET") ?? "vanta-demo-secret-change-me-in-production-32chars",
};

export const features = {
  /** Postgres (Supabase or any Postgres) instead of the embedded demo DB. */
  externalDatabase: Boolean(env.databaseUrl),
  supabaseAuth: Boolean(env.supabaseUrl && env.supabaseAnonKey),
  supabaseStorage: Boolean(env.supabaseUrl && env.supabaseServiceRoleKey),
  /** Stripe is only enabled with *test* keys. Live keys are refused on purpose. */
  stripe: Boolean(env.stripeSecretKey?.startsWith("sk_test_")),
  stripeLiveKeyRejected: Boolean(env.stripeSecretKey && !env.stripeSecretKey.startsWith("sk_test_")),
};

export const isDemoAuth = !features.supabaseAuth;
