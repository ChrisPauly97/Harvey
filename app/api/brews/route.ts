import { db } from "@/lib/db";
import { brews, coffees, equipment } from "@/lib/schema";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { alias } from "drizzle-orm/sqlite-core";

const VALID_BREW_METHODS = [
  "pour_over",
  "espresso",
  "aeropress",
  "french_press",
  "chemex",
  "v60",
  "kalita",
  "moka_pot",
  "cold_brew",
  "other",
] as const;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const coffeeIdFilter = searchParams.get("coffeeId");

    const brewingDevices = alias(equipment, "brewing_devices");
    const grinders = alias(equipment, "grinders");

    const allBrews = await db
      .select({
        id: brews.id,
        coffeeId: brews.coffeeId,
        coffeeName: coffees.name,
        brewingDeviceId: brews.brewingDeviceId,
        brewingDeviceName: brewingDevices.name,
        grinderId: brews.grinderId,
        grinderName: grinders.name,
        brewMethod: brews.brewMethod,
        grindSize: brews.grindSize,
        weightIn: brews.weightIn,
        weightOut: brews.weightOut,
        extractionTime: brews.extractionTime,
        waterTemperature: brews.waterTemperature,
        tastingNotes: brews.tastingNotes,
        rating: brews.rating,
        notes: brews.notes,
        brewedAt: brews.brewedAt,
      })
      .from(brews)
      .leftJoin(coffees, eq(brews.coffeeId, coffees.id))
      .leftJoin(brewingDevices, eq(brews.brewingDeviceId, brewingDevices.id))
      .leftJoin(grinders, eq(brews.grinderId, grinders.id))
      .orderBy(desc(brews.brewedAt));

    const filtered = coffeeIdFilter
      ? allBrews.filter((b) => b.coffeeId === parseInt(coffeeIdFilter))
      : allBrews;

    return NextResponse.json(filtered);
  } catch (error) {
    console.error("Error fetching brews:", error);
    return NextResponse.json({ error: "Failed to fetch brews" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      coffeeId,
      brewingDeviceId,
      grinderId,
      brewMethod,
      grindSize,
      weightIn,
      weightOut,
      extractionTime,
      waterTemperature,
      tastingNotes,
      rating,
      notes,
    } = body;

    if (!brewMethod) {
      return NextResponse.json({ error: "brewMethod is required" }, { status: 400 });
    }

    if (!VALID_BREW_METHODS.includes(brewMethod)) {
      return NextResponse.json({ error: "Invalid brewMethod" }, { status: 400 });
    }

    if (rating !== undefined && rating !== null && (rating < 1 || rating > 5)) {
      return NextResponse.json({ error: "rating must be between 1 and 5" }, { status: 400 });
    }

    const [newBrew] = await db
      .insert(brews)
      .values({
        coffeeId: coffeeId ?? null,
        brewingDeviceId: brewingDeviceId ?? null,
        grinderId: grinderId ?? null,
        brewMethod,
        grindSize,
        weightIn,
        weightOut,
        extractionTime,
        waterTemperature,
        tastingNotes,
        rating,
        notes,
      })
      .returning();

    return NextResponse.json(newBrew, { status: 201 });
  } catch (error) {
    console.error("Error logging brew:", error);
    return NextResponse.json({ error: "Failed to log brew" }, { status: 500 });
  }
}
