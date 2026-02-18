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
 * Optimized to avoid N+1 queries
 */
async function generateAutoSuggestions() {
  const suggestions: typeof shoppingListItems.$inferSelect[] = [];

  try {
    // Get all original items with quantity = 1 AND usageLevel < 25%
    // This avoids suggesting items that last a long time (like spices)
    const lowQuantityItems = await db
      .select()
      .from(items)
      .where(and(
        eq(items.isOriginal, true),
        eq(items.quantity, 1),
        sql`${items.usageLevel} < 25`
      ));

    // Get all items in shopping list that are not purchased (to avoid duplicates)
    const existingListItems = await db
      .select()
      .from(shoppingListItems)
      .where(eq(shoppingListItems.isPurchased, false));

    const existingSet = new Set(
      existingListItems.map((item) => `${item.barcode}:${item.category}`)
    );

    // For low quantity items, create suggestions
    for (const item of lowQuantityItems) {
      const key = `${item.barcode}:${item.category}`;

      // Skip if already in shopping list
      if (existingSet.has(key)) continue;

      // Determine priority based on quantity
      const priority = item.quantity === 0 ? "high" : "medium";
      const reason =
        item.quantity === 0
          ? "Out of stock"
          : `Low stock (${item.quantity} remaining)`;

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
  } catch (error) {
    console.error("Error generating auto-suggestions:", error);
    // Return empty suggestions if generation fails
  }

  return suggestions;
}
