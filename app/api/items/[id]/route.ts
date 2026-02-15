import { db } from "@/lib/db";
import { items } from "@/lib/schema";
import { eq, or, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { logItemEvent } from "@/lib/events";

// DELETE /api/items/[id] - Delete item completely
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const { searchParams } = new URL(request.url);
    const cascade = searchParams.get("cascade") === "true";

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid item ID" }, { status: 400 });
    }

    // Check if item has children
    const children = await db
      .select()
      .from(items)
      .where(eq(items.parentId, id));

    if (children.length > 0 && !cascade) {
      // Item has children and cascade not requested - return error for confirmation
      return NextResponse.json(
        {
          error: "has_children",
          count: children.length,
        },
        { status: 409 }
      );
    }

    // Fetch the item(s) being deleted to log events
    const itemsToDelete = await db
      .select()
      .from(items)
      .where(cascade && children.length > 0 ? or(eq(items.id, id), eq(items.parentId, id)) : eq(items.id, id));

    if (cascade && children.length > 0) {
      // Delete parent AND all children
      await db
        .delete(items)
        .where(or(eq(items.id, id), eq(items.parentId, id)));
    } else {
      // Normal delete (no children or child being deleted)
      await db.delete(items).where(eq(items.id, id));
    }

    // Log deleted events for all deleted items
    for (const deletedItem of itemsToDelete) {
      await logItemEvent({
        itemId: deletedItem.id,
        barcode: deletedItem.barcode,
        name: deletedItem.name,
        category: deletedItem.category,
        eventType: "deleted",
        quantityChange: -deletedItem.quantity,
        metadata: { quantity: deletedItem.quantity },
      });
    }

    return NextResponse.json({ success: true, deleted: true });
  } catch (error) {
    console.error("Error deleting item:", error);
    return NextResponse.json(
      { error: "Failed to delete item" },
      { status: 500 }
    );
  }
}

// PATCH /api/items/[id] - Update quantity or other fields
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    const { action, usageLevel, expirationDate, brand, tags, portionSize, portionAmount, portionUnit } = body;

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid item ID" }, { status: 400 });
    }

    // Handle quantity updates (increment/decrement)
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

        // Log quantity decrement event
        await logItemEvent({
          itemId: updatedItem.id,
          barcode: updatedItem.barcode,
          name: updatedItem.name,
          category: updatedItem.category,
          eventType: "quantity_decrement",
          quantityChange: -1,
          metadata: { newQuantity: updatedItem.quantity },
        });

        return NextResponse.json(updatedItem);
      } else {
        // Log deleted event when quantity reaches 0
        await logItemEvent({
          itemId: item.id,
          barcode: item.barcode,
          name: item.name,
          category: item.category,
          eventType: "deleted",
          quantityChange: -1,
          metadata: { quantity: item.quantity },
        });

        await db.delete(items).where(eq(items.id, id));
        return NextResponse.json({ success: true, deleted: true });
      }
    }

    // Handle field updates
    const [currentItem] = await db.select().from(items).where(eq(items.id, id));

    if (!currentItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (usageLevel !== undefined) updateData.usageLevel = usageLevel;
    if (expirationDate !== undefined) updateData.expirationDate = expirationDate ? new Date(expirationDate) : null;
    if (brand !== undefined) updateData.brand = brand;
    if (tags !== undefined) updateData.tags = tags;
    if (portionSize !== undefined) updateData.portionSize = portionSize;
    if (portionAmount !== undefined) updateData.portionAmount = portionAmount;
    if (portionUnit !== undefined) updateData.portionUnit = portionUnit;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const [updatedItem] = await db
      .update(items)
      .set(updateData)
      .where(eq(items.id, id))
      .returning();

    // Log usage_updated event if usageLevel changed
    if (usageLevel !== undefined && usageLevel !== currentItem.usageLevel) {
      await logItemEvent({
        itemId: updatedItem.id,
        barcode: updatedItem.barcode,
        name: updatedItem.name,
        category: updatedItem.category,
        eventType: "usage_updated",
        usageLevelBefore: currentItem.usageLevel || undefined,
        usageLevelAfter: updatedItem.usageLevel || undefined,
        metadata: { changedFields: Object.keys(updateData) },
      });
    }

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error("Error updating item:", error);
    return NextResponse.json(
      { error: "Failed to update item" },
      { status: 500 }
    );
  }
}
