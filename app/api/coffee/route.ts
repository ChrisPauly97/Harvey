import { db } from "@/lib/db";
import { coffees, brews } from "@/lib/schema";
import { desc, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const allCoffees = await db
      .select({
        id: coffees.id,
        name: coffees.name,
        origin: coffees.origin,
        roaster: coffees.roaster,
        roastDate: coffees.roastDate,
        roastLevel: coffees.roastLevel,
        process: coffees.process,
        variety: coffees.variety,
        description: coffees.description,
        isActive: coffees.isActive,
        imageUrl: coffees.imageUrl,
        addedAt: coffees.addedAt,
        brewCount: sql<number>`(SELECT COUNT(*) FROM ${brews} WHERE ${brews.coffeeId} = ${coffees.id})`.as("brew_count"),
      })
      .from(coffees)
      .orderBy(desc(coffees.addedAt));

    return NextResponse.json(allCoffees);
  } catch (error) {
    console.error("Error fetching coffees:", error);
    return NextResponse.json({ error: "Failed to fetch coffees" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, origin, roaster, roastDate, roastLevel, process, variety, description, imageUrl } = body;

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const validRoastLevels = ["light", "medium", "medium-dark", "dark"];
    if (roastLevel && !validRoastLevels.includes(roastLevel)) {
      return NextResponse.json({ error: "Invalid roastLevel" }, { status: 400 });
    }

    const [newCoffee] = await db
      .insert(coffees)
      .values({ name, origin, roaster, roastDate, roastLevel, process, variety, description, imageUrl })
      .returning();

    return NextResponse.json(newCoffee, { status: 201 });
  } catch (error) {
    console.error("Error creating coffee:", error);
    return NextResponse.json({ error: "Failed to create coffee" }, { status: 500 });
  }
}
