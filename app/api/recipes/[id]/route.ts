import { db } from "@/lib/db";
import { items, recipes } from "@/lib/schema";
import { matchIngredients } from "@/lib/matching";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

/**
 * Get a single recipe with current inventory match details
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const recipeId = parseInt(params.id, 10);

    if (isNaN(recipeId)) {
      return NextResponse.json(
        { error: "Invalid recipe ID" },
        { status: 400 }
      );
    }

    // Fetch recipe
    const recipe = await db
      .select()
      .from(recipes)
      .where(eq(recipes.id, recipeId));

    if (recipe.length === 0) {
      return NextResponse.json(
        { error: "Recipe not found" },
        { status: 404 }
      );
    }

    // Fetch inventory items
    const inventoryItems = await db
      .select()
      .from(items)
      .where(eq(items.isOriginal, true));

    // Match inventory against recipe
    const match = matchIngredients(
      inventoryItems,
      recipe[0].ingredients || []
    );

    return NextResponse.json({
      recipe: recipe[0],
      matched: match.matched,
      missing: match.missing,
      matchScore: match.matchScore,
      totalIngredients: match.totalIngredients,
      matchedCount: match.matchedCount,
      missingCount: match.missingCount,
    });
  } catch (error) {
    console.error("Error fetching recipe details:", error);
    return NextResponse.json(
      { error: "Failed to fetch recipe details" },
      { status: 500 }
    );
  }
}
