import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";
import * as path from "path";

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

  console.log("Checking migration status...\n");

  // Check __drizzle_migrations table
  try {
    const result = await client.execute("SELECT * FROM __drizzle_migrations ORDER BY id");
    console.log("Applied migrations:");
    for (const row of result.rows) {
      console.log(`  - ${row.hash} (created: ${row.created_at})`);
    }
    console.log();
  } catch (error) {
    console.log("No __drizzle_migrations table found\n");
  }

  // Check table structure
  const schema = await client.execute("PRAGMA table_info(items)");
  console.log("Current items table columns:");
  for (const row of schema.rows) {
    console.log(`  - ${row.name} (${row.type})`);
  }
  console.log();

  // Check indexes
  const indexes = await client.execute("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='items'");
  console.log("Current indexes:");
  for (const row of indexes.rows) {
    console.log(`  - ${row.name}`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Check failed:", err);
  process.exit(1);
});
