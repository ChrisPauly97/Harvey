import { sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

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
    // Phase 3: Portion splitting fields
    parentId: integer("parent_id").references((): any => items.id),
    portionSize: text("portion_size"),
    portionUnit: text("portion_unit"),
    portionAmount: real("portion_amount"),
    isOriginal: integer("is_original", { mode: "boolean" }).notNull().default(true),
  },
  (table) => ({
    // Partial unique index: only applies to original items (parentId IS NULL)
    // Allows multiple portions from same product to exist
    barcodeCategory: uniqueIndex("items_barcode_category_unique")
      .on(table.barcode, table.category)
      .where(sql`${table.parentId} IS NULL`),
    // Index for efficient child lookups
    parentIdIdx: index("items_parent_id_idx").on(table.parentId),
  })
);

export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
