import { db } from "@/lib/db";
import { equipment } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid equipment ID" }, { status: 400 });
    }

    const updates = await request.json();

    const [updated] = await db
      .update(equipment)
      .set(updates)
      .where(eq(equipment.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Equipment not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating equipment:", error);
    return NextResponse.json({ error: "Failed to update equipment" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid equipment ID" }, { status: 400 });
    }

    await db.delete(equipment).where(eq(equipment.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting equipment:", error);
    return NextResponse.json({ error: "Failed to delete equipment" }, { status: 500 });
  }
}
