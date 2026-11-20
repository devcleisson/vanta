/** Seeds the demo catalog (categories, sizes, colours, products, variants, images, coupons). */
import "dotenv/config";

async function main() {
  const { getDb } = await import("../src/server/db/client");
  const { seedCatalog, seedDemoAccounts } = await import("../src/server/db/seed");
  const db = await getDb();
  await seedCatalog(db);
  await seedDemoAccounts(db);
  console.log("✓ Catalog seeded");
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
