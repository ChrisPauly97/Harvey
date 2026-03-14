import { db } from "@/lib/db";
import { equipment } from "@/lib/schema";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const typeFilter = searchParams.get("type");

    let allEquipment;
    if (typeFilter) {
      allEquipment = await db
        .select()
        .from(equipment)
        .where(eq(equipment.type, typeFilter as any))
        .orderBy(desc(equipment.addedAt));
    } else {
      allEquipment = await db
        .select()
        .from(equipment)
        .orderBy(desc(equipment.addedAt));
    }

    return NextResponse.json(allEquipment);
  } catch (error) {
    console.error("Error fetching equipment:", error);
    return NextResponse.json({ error: "Failed to fetch equipment" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, brand, type, notes } = body;

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const validTypes = ["grinder", "espresso_machine", "pour_over", "other"];
    if (!type || !validTypes.includes(type)) {
      return NextResponse.json(
        { error: "type must be one of: grinder, espresso_machine, pour_over, other" },
        { status: 400 }
      );
    }

    const [newEquipment] = await db
      .insert(equipment)
      .values({ name, brand, type, notes })
      .returning();

    return NextResponse.json(newEquipment, { status: 201 });
  } catch (error) {
    console.error("Error creating equipment:", error);
    return NextResponse.json({ error: "Failed to create equipment" }, { status: 500 });
  }
}
