import { db } from "@/lib/db";
import { items } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

// POST /api/items/[id]/split - Split item into portions
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    const { numPortions, portionSize, portionAmount, portionUnit, expirationDate } = body;

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid item ID" }, { status: 400 });
    }

    // Validate numPortions
    if (!numPortions || numPortions < 2) {
      return NextResponse.json(
        { error: "numPortions must be at least 2" },
        { status: 400 }
      );
    }

    // Fetch parent item
    const [parentItem] = await db.select().from(items).where(eq(items.id, id));

    if (!parentItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Validate: only original items can be split
    if (parentItem.parentId !== null) {
      return NextResponse.json(
        { error: "Cannot split portions (only original items can be split)" },
        { status: 400 }
      );
    }

    // Validate: quantity must be sufficient
    if (parentItem.quantity < 2) {
      return NextResponse.json(
        { error: "Item quantity must be at least 2 to split" },
        { status: 400 }
      );
    }

    if (numPortions > parentItem.quantity) {
      return NextResponse.json(
        { error: `Cannot create ${numPortions} portions from ${parentItem.quantity} items` },
        { status: 400 }
      );
    }

    // Create child portions
    const childrenData = [];
    for (let i = 0; i < numPortions; i++) {
      childrenData.push({
        barcode: parentItem.barcode,
        name: parentItem.name,
        quantity: 1,
        category: parentItem.category,
        imageUrl: parentItem.imageUrl,
        brand: parentItem.brand,
        tags: parentItem.tags,
        addedAt: parentItem.addedAt,
        expirationDate: expirationDate ? new Date(expirationDate) : parentItem.expirationDate,
        usageLevel: 100, // Each new portion starts full
        parentId: id,
        isOriginal: false,
        portionSize: portionSize || null,
        portionAmount: portionAmount || null,
        portionUnit: portionUnit || null,
      });
    }

    const children = await db.insert(items).values(childrenData).returning();

    // Calculate new parent quantity
    const newQuantity = parentItem.quantity - numPortions;

    let parent = null;
    let deleted = false;

    if (newQuantity === 0) {
      // Delete parent if fully split
      await db.delete(items).where(eq(items.id, id));
      deleted = true;
    } else {
      // Update parent quantity
      const [updatedParent] = await db
        .update(items)
        .set({ quantity: newQuantity })
        .where(eq(items.id, id))
        .returning();
      parent = updatedParent;
    }

    return NextResponse.json({
      parent,
      children,
      deleted,
    });
  } catch (error) {
    console.error("Error splitting item:", error);
    return NextResponse.json(
      { error: "Failed to split item" },
      { status: 500 }
    );
  }
}
