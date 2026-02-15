import { db } from "@/lib/db";
import { items } from "@/lib/schema";
import { desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

// GET /api/items - List all items
export async function GET() {
  try {
    const allItems = await db
      .select()
      .from(items)
      .orderBy(desc(items.addedAt));

    return NextResponse.json(allItems);
  } catch (error) {
    console.error("Error fetching items:", error);
    return NextResponse.json(
      { error: "Failed to fetch items" },
      { status: 500 }
    );
  }
}

// POST /api/items - Add a new item
export async function POST(request: Request) {
  try {
    const { barcode, category = "fridge" } = await request.json();

    if (!barcode) {
      return NextResponse.json(
        { error: "Barcode is required" },
        { status: 400 }
      );
    }

    if (!["fridge", "pantry"].includes(category)) {
      return NextResponse.json(
        { error: "Category must be 'fridge' or 'pantry'" },
        { status: 400 }
      );
    }

    // Check if item already exists
    const existingItems = await db
      .select()
      .from(items)
      .where(eq(items.barcode, barcode));

    if (existingItems.length > 0) {
      // Item exists, increment quantity
      const [updatedItem] = await db
        .update(items)
        .set({ quantity: sql`${items.quantity} + 1` })
        .where(eq(items.barcode, barcode))
        .returning();

      return NextResponse.json(updatedItem, { status: 200 });
    }

    // Fetch product info from Open Food Facts API
    let productName = barcode;
    let imageUrl = null;

    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
      );
      const data = await response.json();

      if (data.status === 1 && data.product) {
        productName = data.product.product_name || barcode;
        imageUrl = data.product.image_url || null;
      }
    } catch (apiError) {
      console.warn("Failed to fetch product data:", apiError);
      // Continue with barcode as name if API fails
    }

    // Insert new item into database
    const [newItem] = await db
      .insert(items)
      .values({
        barcode,
        name: productName,
        imageUrl,
        quantity: 1,
        category,
      })
      .returning();

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error("Error adding item:", error);
    return NextResponse.json(
      { error: "Failed to add item" },
      { status: 500 }
    );
  }
}
