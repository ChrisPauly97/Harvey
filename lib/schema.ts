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
    // Phase 4: Recurring item tracking
    isRecurring: integer("is_recurring", { mode: "boolean" }).notNull().default(false),
    recurringInterval: text("recurring_interval", { enum: ["weekly", "biweekly", "monthly"] }),
    lastPurchaseDate: integer("last_purchase_date", { mode: "timestamp" }),
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

// Phase 4: Event history for trend analysis
export const itemEvents = sqliteTable(
  "item_events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    itemId: integer("item_id").references(() => items.id, { onDelete: "set null" }),
    barcode: text("barcode").notNull(),
    name: text("name").notNull(),
    category: text("category", { enum: ["fridge", "freezer", "pantry"] }).notNull(),
    eventType: text("event_type", {
      enum: ["added", "quantity_increment", "quantity_decrement", "deleted", "usage_updated"],
    }).notNull(),
    quantityChange: integer("quantity_change"),
    usageLevelBefore: integer("usage_level_before"),
    usageLevelAfter: integer("usage_level_after"),
    timestamp: integer("timestamp", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    metadata: text("metadata", { mode: "json" }).$type<Record<string, any>>().default(sql`'{}'`),
  },
  (table) => ({
    barcodeIdx: index("item_events_barcode_category_idx").on(
      table.barcode,
      table.category,
      table.timestamp
    ),
    timestampIdx: index("item_events_timestamp_idx").on(table.timestamp),
  })
);

// Phase 4: Shopping list items
export const shoppingListItems = sqliteTable(
  "shopping_list_items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    barcode: text("barcode"),
    name: text("name").notNull(),
    category: text("category", { enum: ["fridge", "freezer", "pantry"] })
      .notNull()
      .default("pantry"),
    source: text("source", { enum: ["manual", "auto_suggestion", "recurring"] }).notNull(),
    isPurchased: integer("is_purchased", { mode: "boolean" }).notNull().default(false),
    predictedPurchaseDate: integer("predicted_purchase_date", { mode: "timestamp" }),
    priority: text("priority", { enum: ["high", "medium", "low"] })
      .notNull()
      .default("medium"),
    addedAt: integer("added_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    purchasedAt: integer("purchased_at", { mode: "timestamp" }),
    notes: text("notes"),
  },
  (table) => ({
    purchasedIdx: index("shopping_list_is_purchased_idx").on(table.isPurchased),
  })
);

// Phase 5: Recipe suggestion system
export interface RecipeIngredient {
  name: string; // e.g., "chicken breast"
  measure: string; // e.g., "500g" or "2 cups"
}

export const recipes = sqliteTable(
  "recipes",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    externalId: text("external_id").unique(),
    source: text("source", { enum: ["themealdb", "custom"] })
      .notNull()
      .default("themealdb"),
    name: text("name").notNull(),
    category: text("category"), // "Beef", "Vegetarian", "Dessert"
    area: text("area"), // "Italian", "Mexican", "British"
    instructions: text("instructions").notNull(),
    imageUrl: text("image_url"),
    youtubeUrl: text("youtube_url"),
    tags: text("tags", { mode: "json" })
      .$type<string[]>()
      .default(sql`'[]'`),
    ingredients: text("ingredients", { mode: "json" })
      .$type<RecipeIngredient[]>()
      .default(sql`'[]'`),
    servings: integer("servings").default(4),
    prepTime: integer("prep_time"),
    cookTime: integer("cook_time"),
    cachedAt: integer("cached_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => ({
    sourceIdx: index("recipes_source_idx").on(table.source),
    categoryIdx: index("recipes_category_idx").on(table.category),
  })
);

export type Recipe = typeof recipes.$inferSelect;
export type NewRecipe = typeof recipes.$inferInsert;

export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
export type ItemEvent = typeof itemEvents.$inferSelect;
export type NewItemEvent = typeof itemEvents.$inferInsert;
export type ShoppingListItem = typeof shoppingListItems.$inferSelect;
export type NewShoppingListItem = typeof shoppingListItems.$inferInsert;
