import { db } from "@/lib/db";
import { items, shoppingListItems } from "@/lib/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { shouldSuggestPurchase } from "@/lib/analytics";

export async function GET() {
  try {
    // Fetch manual and recurring items
    const [manualItems, recurringItems] = await Promise.all([
      db
        .select()
        .from(shoppingListItems)
        .where(eq(shoppingListItems.source, "manual"))
        .orderBy(desc(shoppingListItems.addedAt)),
      db
        .select()
        .from(shoppingListItems)
        .where(eq(shoppingListItems.source, "recurring"))
        .orderBy(desc(shoppingListItems.predictedPurchaseDate)),
    ]);

    // Fetch auto-suggestions from inventory
    const suggestions = await generateAutoSuggestions();

    return NextResponse.json({
      manual: manualItems,
      recurring: recurringItems,
      suggestions,
    });
  } catch (error) {
    console.error("Error fetching shopping list:", error);
    return NextResponse.json(
      { error: "Failed to fetch shopping list" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { barcode, name, category = "pantry", source = "manual", priority = "medium", notes } =
      await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }

    if (!["fridge", "freezer", "pantry"].includes(category)) {
      return NextResponse.json(
        { error: "Invalid category" },
        { status: 400 }
      );
    }

    if (!["manual", "auto_suggestion", "recurring"].includes(source)) {
      return NextResponse.json(
        { error: "Invalid source" },
        { status: 400 }
      );
    }

    const [item] = await db
      .insert(shoppingListItems)
      .values({
        barcode,
        name,
        category,
        source,
        priority,
        notes,
      })
      .returning();

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Error adding shopping list item:", error);
    return NextResponse.json(
      { error: "Failed to add shopping list item" },
      { status: 500 }
    );
  }
}

/**
 * Generate auto-suggestions based on inventory trends
 * Rules:
 * 1. Low quantity with consumption history
 * 2. Regularly purchased items due for repurchase
 * 3. Items expiring soon that are regularly repurchased
 */
async function generateAutoSuggestions() {
  const suggestions: typeof shoppingListItems.$inferSelect[] = [];

  try {
    // Get all items in inventory
    const inventoryItems = await db.select().from(items).where(eq(items.isOriginal, true));

    for (const item of inventoryItems) {
      // Skip portions
      if (item.parentId) continue;

      const { should, reason, priority } = await shouldSuggestPurchase(
        item.barcode,
        item.category,
        item.quantity
      );

      if (should) {
        // Check if already in shopping list
        const existing = await db
          .select()
          .from(shoppingListItems)
          .where(
            and(
              eq(shoppingListItems.barcode, item.barcode),
              eq(shoppingListItems.category, item.category),
              eq(shoppingListItems.isPurchased, false)
            )
          );

        if (existing.length === 0) {
          // Create virtual suggestion (not persisted, returned in response)
          suggestions.push({
            id: 0, // Virtual ID for suggestions
            barcode: item.barcode,
            name: item.name,
            category: item.category,
            source: "auto_suggestion",
            isPurchased: false,
            predictedPurchaseDate: null,
            priority,
            addedAt: new Date(),
            purchasedAt: null,
            notes: reason,
          });
        }
      }
    }
  } catch (error) {
    console.error("Error generating auto-suggestions:", error);
    // Return empty suggestions if generation fails
  }

  return suggestions;
}
