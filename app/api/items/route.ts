import { db } from "@/lib/db";
import { items } from "@/lib/schema";
import { and, desc, eq, sql } from "drizzle-orm";
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
    const { barcode, category = "fridge", expirationDate, brand } = await request.json();

    if (!barcode) {
      return NextResponse.json(
        { error: "Barcode is required" },
        { status: 400 }
      );
    }

    if (!["fridge", "freezer", "pantry"].includes(category)) {
      return NextResponse.json(
        { error: "Category must be 'fridge', 'freezer', or 'pantry'" },
        { status: 400 }
      );
    }

    // Check if item already exists in this category
    const existingItem = await db
      .select()
      .from(items)
      .where(and(eq(items.barcode, barcode), eq(items.category, category)));

    if (existingItem.length > 0) {
      // Item exists in this category, increment quantity
      const [updatedItem] = await db
        .update(items)
        .set({ quantity: sql`${items.quantity} + 1` })
        .where(
          and(eq(items.barcode, barcode), eq(items.category, category))
        )
        .returning();

      return NextResponse.json(updatedItem, { status: 200 });
    }

    // Fetch product info from Open Food Facts API
    let productName = barcode;
    let imageUrl = null;
    let productBrand = brand;

    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
      );
      const data = await response.json();

      if (data.status === 1 && data.product) {
        productName = data.product.product_name || barcode;
        imageUrl = data.product.image_url || null;
        productBrand = productBrand || data.product.brands || null;
      }
    } catch (apiError) {
      console.warn("Failed to fetch product data:", apiError);
      // Continue with barcode as name if API fails
    }

    // Parse expiration date if provided
    let parsedExpirationDate = null;
    if (expirationDate) {
      parsedExpirationDate = new Date(expirationDate);
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
        expirationDate: parsedExpirationDate,
        brand: productBrand,
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
