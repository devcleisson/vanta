/** Deletes the embedded demo database. It is recreated and re-seeded on next start. */
import "dotenv/config";
import { rmSync } from "node:fs";
import path from "node:path";

if (process.env.DATABASE_URL) {
  console.error("db:reset only works for the embedded demo database (no DATABASE_URL).");
  process.exit(1);
}
const dir = path.resolve(process.cwd(), process.env.PGLITE_DIR ?? ".data/pglite");
rmSync(dir, { recursive: true, force: true });
console.log("✓ Removed", dir, "— it will be recreated on the next `npm run dev`.");
