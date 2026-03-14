import { db } from "@/lib/db";
import { coffees, brews } from "@/lib/schema";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid coffee ID" }, { status: 400 });
    }

    const [coffee] = await db.select().from(coffees).where(eq(coffees.id, id));
    if (!coffee) {
      return NextResponse.json({ error: "Coffee not found" }, { status: 404 });
    }

    const coffeeBrews = await db
      .select()
      .from(brews)
      .where(eq(brews.coffeeId, id))
      .orderBy(desc(brews.brewedAt));

    return NextResponse.json({ ...coffee, brews: coffeeBrews });
  } catch (error) {
    console.error("Error fetching coffee:", error);
    return NextResponse.json({ error: "Failed to fetch coffee" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid coffee ID" }, { status: 400 });
    }

    const updates = await request.json();

    const [updated] = await db
      .update(coffees)
      .set(updates)
      .where(eq(coffees.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Coffee not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating coffee:", error);
    return NextResponse.json({ error: "Failed to update coffee" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid coffee ID" }, { status: 400 });
    }

    await db.delete(coffees).where(eq(coffees.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting coffee:", error);
    return NextResponse.json({ error: "Failed to delete coffee" }, { status: 500 });
  }
}
