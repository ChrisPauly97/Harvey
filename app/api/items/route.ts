import { db } from "@/lib/db";
import { items } from "@/lib/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { logItemEvent } from "@/lib/events";
import { unstable_cache, revalidateTag } from "next/cache";

// Cached function to fetch all items
const getCachedItems = unstable_cache(
  async () => {
    const allItems = await db
      .select({
        id: items.id,
        barcode: items.barcode,
        name: items.name,
        quantity: items.quantity,
        category: items.category,
        addedAt: items.addedAt,
        imageUrl: items.imageUrl,
        expirationDate: items.expirationDate,
        usageLevel: items.usageLevel,
        brand: items.brand,
        tags: items.tags,
        parentId: items.parentId,
        portionSize: items.portionSize,
        portionUnit: items.portionUnit,
        portionAmount: items.portionAmount,
        isOriginal: items.isOriginal,
        childCount: sql<number>`(SELECT COUNT(*) FROM ${items} AS c WHERE c.parent_id = ${items.id})`.as('childCount'),
      })
      .from(items)
      .orderBy(desc(items.addedAt));

    return allItems;
  },
  ['items-list'],
  {
    revalidate: 30, // Cache for 30 seconds
    tags: ['items'],
  }
);

// GET /api/items - List all items with child count
export async function GET() {
  try {
    const allItems = await getCachedItems();

    return NextResponse.json(allItems, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
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

    // Check if an ORIGINAL item already exists in this category
    // (portions can have the same barcode+category, but not original items)
    const existingItem = await db
      .select()
      .from(items)
      .where(
        and(
          eq(items.barcode, barcode),
          eq(items.category, category),
          sql`${items.parentId} IS NULL`
        )
      );

    if (existingItem.length > 0) {
      // Original item exists in this category, increment quantity
      const [updatedItem] = await db
        .update(items)
        .set({ quantity: sql`${items.quantity} + 1` })
        .where(eq(items.id, existingItem[0].id))
        .returning();

      // Log quantity increment event
      await logItemEvent({
        itemId: updatedItem.id,
        barcode: updatedItem.barcode,
        name: updatedItem.name,
        category: updatedItem.category,
        eventType: "quantity_increment",
        quantityChange: 1,
        metadata: { newQuantity: updatedItem.quantity },
      });

      // Invalidate cache
      revalidateTag('items');

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

    // Log added event
    await logItemEvent({
      itemId: newItem.id,
      barcode: newItem.barcode,
      name: newItem.name,
      category: newItem.category,
      eventType: "added",
      quantityChange: 1,
      metadata: {
        brand: productBrand,
        expirationDate: parsedExpirationDate?.toISOString(),
      },
    });

    // Invalidate cache
    revalidateTag('items');

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error("Error adding item:", error);
    return NextResponse.json(
      { error: "Failed to add item" },
      { status: 500 }
    );
  }
}
