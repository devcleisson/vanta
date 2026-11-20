import path from "node:path";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { env } from "@/config/env";
import * as schema from "./schema";

/**
 * Database access layer.
 *
 * Production: Postgres (Supabase) through `postgres-js`.
 * Demo: PGlite — real Postgres compiled to WASM, persisted on disk — so the
 * project runs with `npm run dev` and zero configuration. Both drivers share
 * the same Drizzle schema and query API.
 */
export type Database = PostgresJsDatabase<typeof schema>;

type DbState = { promise?: Promise<Database> };
const globalForDb = globalThis as unknown as { __vantaDb?: DbState };
const state: DbState = (globalForDb.__vantaDb ??= {});

async function createPostgres(): Promise<Database> {
  const { drizzle } = await import("drizzle-orm/postgres-js");
  const postgres = (await import("postgres")).default;
  const client = postgres(env.databaseUrl!, {
    // Supabase's transaction pooler does not support prepared statements.
    prepare: false,
    max: process.env.NODE_ENV === "production" ? 5 : 3,
  });
  return drizzle(client, { schema });
}

async function createPglite(): Promise<Database> {
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");

  const dataDir = path.resolve(/* turbopackIgnore: true */ process.cwd(), env.pgliteDir);
  const { mkdirSync } = await import("node:fs");
  mkdirSync(path.dirname(dataDir), { recursive: true });
  const client = new PGlite(dataDir);
  await client.waitReady;
  const db = drizzle(client, { schema });

  await migrate(db, { migrationsFolder: path.join(/* turbopackIgnore: true */ process.cwd(), "drizzle") });

  const { seedIfEmpty } = await import("./seed");
  await seedIfEmpty(db as unknown as Database);

  return db as unknown as Database;
}

export function getDb(): Promise<Database> {
  if (!state.promise) {
    state.promise = (env.databaseUrl ? createPostgres() : createPglite()).catch((error) => {
      state.promise = undefined;
      throw error;
    });
  }
  return state.promise;
}

export { schema };
