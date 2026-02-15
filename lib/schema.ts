import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const items = sqliteTable(
  "items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    barcode: text("barcode").notNull(),
    name: text("name").notNull(),
    quantity: integer("quantity").notNull().default(1),
    category: text("category", { enum: ["fridge", "freezer", "pantry"] })
      .notNull()
      .default("fridge"),
    addedAt: integer("added_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    imageUrl: text("image_url"),
    expirationDate: integer("expiration_date", { mode: "timestamp" }),
    usageLevel: integer("usage_level").default(100),
    brand: text("brand"),
    tags: text("tags", { mode: "json" }).$type<string[]>().default(sql`'[]'`),
  },
  (table) => ({
    barcodeCategory: uniqueIndex("items_barcode_category_unique").on(
      table.barcode,
      table.category
    ),
  })
);

export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
