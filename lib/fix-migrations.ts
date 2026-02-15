import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
import * as crypto from "crypto";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function main() {
  if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
    throw new Error("Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN in .env.local");
  }

  const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  console.log("Manually marking migration 0003 as applied...\n");

  // Read migration 0003 file and calculate its hash
  const migration0003Path = path.join(process.cwd(), "drizzle", "0003_yielding_wolverine.sql");
  const migration0003Content = fs.readFileSync(migration0003Path, "utf-8");
  const hash = crypto.createHash("sha256").update(migration0003Content).digest("hex");

  // Get the timestamp from the journal
  const journalPath = path.join(process.cwd(), "drizzle", "meta", "_journal.json");
  const journal = JSON.parse(fs.readFileSync(journalPath, "utf-8"));
  const migration0003Entry = journal.entries.find((e: any) => e.tag === "0003_yielding_wolverine");

  if (!migration0003Entry) {
    throw new Error("Migration 0003 not found in journal");
  }

  const timestamp = migration0003Entry.when;

  // Insert the migration record
  await client.execute({
    sql: "INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)",
    args: [hash, timestamp],
  });

  console.log(`✅ Migration 0003 marked as applied (hash: ${hash.substring(0, 16)}...)\n`);

  // Now run the migrator to apply migration 0004
  console.log("Running migration 0004 (Phase 3: Portion Splitting)...\n");

  const db = drizzle(client);
  await migrate(db, { migrationsFolder: "./drizzle" });

  console.log("✅ All migrations complete!\n");

  process.exit(0);
}

main().catch((err) => {
  console.error("Migration fix failed:", err);
  process.exit(1);
});
