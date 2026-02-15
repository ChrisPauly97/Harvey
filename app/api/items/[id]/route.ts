import { db } from "@/lib/db";
import { items } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

// DELETE /api/items/[id] - Delete item completely
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid item ID" }, { status: 400 });
    }

    await db.delete(items).where(eq(items.id, id));
    return NextResponse.json({ success: true, deleted: true });
  } catch (error) {
    console.error("Error deleting item:", error);
    return NextResponse.json(
      { error: "Failed to delete item" },
      { status: 500 }
    );
  }
}

// PATCH /api/items/[id] - Update quantity
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const { action } = await request.json();

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid item ID" }, { status: 400 });
    }

    if (action === "increment") {
      const [updatedItem] = await db
        .update(items)
        .set({ quantity: sql`${items.quantity} + 1` })
        .where(eq(items.id, id))
        .returning();

      return NextResponse.json(updatedItem);
    } else if (action === "decrement") {
      // Get current item to check quantity
      const [item] = await db.select().from(items).where(eq(items.id, id));

      if (!item) {
        return NextResponse.json({ error: "Item not found" }, { status: 404 });
      }

      if (item.quantity > 1) {
        const [updatedItem] = await db
          .update(items)
          .set({ quantity: sql`${items.quantity} - 1` })
          .where(eq(items.id, id))
          .returning();

        return NextResponse.json(updatedItem);
      } else {
        await db.delete(items).where(eq(items.id, id));
        return NextResponse.json({ success: true, deleted: true });
      }
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error updating item:", error);
    return NextResponse.json(
      { error: "Failed to update item" },
      { status: 500 }
    );
  }
}
