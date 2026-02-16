import { analyzeConsumption } from "@/lib/analytics";
import { NextResponse, NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const barcode = searchParams.get("barcode");
    const category = searchParams.get("category") || "fridge";
    const days = parseInt(searchParams.get("days") || "30", 10);
    const currentQuantity = parseInt(searchParams.get("quantity") || "0", 10);

    if (!barcode) {
      return NextResponse.json(
        { error: "barcode query parameter is required" },
        { status: 400 }
      );
    }

    if (!["fridge", "freezer", "pantry"].includes(category)) {
      return NextResponse.json(
        { error: "Invalid category" },
        { status: 400 }
      );
    }

    const trend = await analyzeConsumption(
      barcode,
      category as "fridge" | "freezer" | "pantry",
      days,
      currentQuantity
    );

    if (!trend) {
      return NextResponse.json(
        { error: "No consumption history for this item" },
        { status: 404 }
      );
    }

    return NextResponse.json(trend);
  } catch (error) {
    console.error("Error analyzing trends:", error);
    return NextResponse.json(
      { error: "Failed to analyze trends" },
      { status: 500 }
    );
  }
}
