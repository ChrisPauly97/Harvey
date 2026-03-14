import { db } from "@/lib/db";
import { brews } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid brew ID" }, { status: 400 });
    }

    const updates = await request.json();

    const [updated] = await db
      .update(brews)
      .set(updates)
      .where(eq(brews.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Brew not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating brew:", error);
    return NextResponse.json({ error: "Failed to update brew" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid brew ID" }, { status: 400 });
    }

    await db.delete(brews).where(eq(brews.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting brew:", error);
    return NextResponse.json({ error: "Failed to delete brew" }, { status: 500 });
  }
}
