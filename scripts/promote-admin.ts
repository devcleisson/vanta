/** Gives the administrator role to an existing account: npm run admin:promote -- email@domain.com */
import "dotenv/config";
import { sql } from "drizzle-orm";

async function main() {
  const email = process.argv[2];
  if (!email) throw new Error("Usage: npm run admin:promote -- you@example.com");
  const { getDb, schema } = await import("../src/server/db/client");
  const db = await getDb();
  const rows = await db
    .update(schema.profiles)
    .set({ role: "admin" })
    .where(sql`lower(${schema.profiles.email}) = ${email.toLowerCase()}`)
    .returning({ id: schema.profiles.id });
  if (!rows.length) throw new Error(`No account found for ${email}. Sign up first, then run this again.`);
  console.log(`✓ ${email} is now an administrator`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e.message ?? e); process.exit(1); });
