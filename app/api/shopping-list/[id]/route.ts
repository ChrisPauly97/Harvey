import { db } from "@/lib/db";
import { shoppingListItems } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const { isPurchased, priority, notes } = await request.json();

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid item ID" }, { status: 400 });
    }

    const updateData: any = {};
    if (isPurchased !== undefined) updateData.isPurchased = isPurchased;
    if (isPurchased === true) updateData.purchasedAt = new Date();
    if (priority !== undefined) updateData.priority = priority;
    if (notes !== undefined) updateData.notes = notes;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(shoppingListItems)
      .set(updateData)
      .where(eq(shoppingListItems.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Shopping list item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating shopping list item:", error);
    return NextResponse.json(
      { error: "Failed to update shopping list item" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid item ID" }, { status: 400 });
    }

    await db.delete(shoppingListItems).where(eq(shoppingListItems.id, id));

    return NextResponse.json({ success: true, deleted: true });
  } catch (error) {
    console.error("Error deleting shopping list item:", error);
    return NextResponse.json(
      { error: "Failed to delete shopping list item" },
      { status: 500 }
    );
  }
}
