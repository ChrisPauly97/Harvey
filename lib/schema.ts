import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const items = sqliteTable("items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  barcode: text("barcode").notNull().unique(),
  name: text("name").notNull(),
  quantity: integer("quantity").notNull().default(1),
  category: text("category", { enum: ["fridge", "pantry"] })
    .notNull()
    .default("fridge"),
  addedAt: integer("added_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  imageUrl: text("image_url"),
});

export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
