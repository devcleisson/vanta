/**
 * Applies database migrations.
 *  - With DATABASE_URL: runs Drizzle migrations against Postgres and, on Supabase,
 *    applies supabase/policies.sql (RLS, auth trigger, storage bucket).
 *  - Without DATABASE_URL: initialises the embedded demo database in ./.data.
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import path from "node:path";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    const { getDb } = await import("../src/server/db/client");
    await getDb();
    console.log("✓ Demo database (PGlite) ready in", process.env.PGLITE_DIR ?? ".data/pglite");
    return;
  }

  const postgres = (await import("postgres")).default;
  const { drizzle } = await import("drizzle-orm/postgres-js");
  const { migrate } = await import("drizzle-orm/postgres-js/migrator");
  const sql = postgres(url, { prepare: false, max: 1 });
  await migrate(drizzle(sql), { migrationsFolder: path.join(process.cwd(), "drizzle") });
  console.log("✓ Drizzle migrations applied");

  const [{ exists }] = await sql`select exists(select 1 from pg_namespace where nspname = 'auth') as exists`;
  if (exists) {
    await sql.unsafe(readFileSync(path.join(process.cwd(), "supabase/policies.sql"), "utf8"));
    console.log("✓ Supabase RLS policies, auth trigger and storage bucket applied");
  } else {
    console.log("• 'auth' schema not found — skipping Supabase-specific policies");
  }
  await sql.end();
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
