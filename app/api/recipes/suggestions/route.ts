import { db } from "@/lib/db";
import { items, recipes } from "@/lib/schema";
import { matchIngredients, sortByMatchScore } from "@/lib/matching";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Get recipe suggestions based on current inventory
 *
 * Query params:
 * - minMatchScore: minimum % ingredients needed (default: 75)
 * - maxMissing: max missing ingredients to show (default: 5)
 * - category: filter by recipe category (optional)
 * - limit: max recipes to return (default: 10)
 */
export async function GET(request: Request) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const minMatchScore = Math.max(
      0,
      Math.min(100, parseInt(searchParams.get("minMatchScore") || "75", 10))
    );
    const maxMissing = Math.max(
      0,
      parseInt(searchParams.get("maxMissing") || "5", 10)
    );
    const categoryFilter = searchParams.get("category") || undefined;
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "10", 10));

    // Fetch all inventory items (excluding portions)
    const inventoryItems = await db
      .select()
      .from(items)
      .where(eq(items.isOriginal, true));

    // Fetch recipes with filters
    let allRecipes: typeof recipes.$inferSelect[] = [];

    if (categoryFilter) {
      allRecipes = await db
        .select()
        .from(recipes)
        .where(eq(recipes.category, categoryFilter));
    } else {
      allRecipes = await db.select().from(recipes);
    }

    if (allRecipes.length === 0) {
      return NextResponse.json(
        {
          recipes: [],
          inventoryUsed: inventoryItems.length,
          totalInventory: inventoryItems.length,
          message: "No recipes cached. Call POST /api/recipes/cache to populate.",
        },
        { status: 200 }
      );
    }

    // Match each recipe against inventory
    const recipesWithMatches = allRecipes
      .map((recipe) => {
        const match = matchIngredients(inventoryItems, recipe.ingredients || []);
        return {
          recipe,
          ...match,
        };
      })
      // Filter by score and missing count
      .filter(
        (r) => r.matchScore >= minMatchScore && r.missingCount <= maxMissing
      )
      // Sort by match score descending
      .sort((a, b) => b.matchScore - a.matchScore)
      // Limit results
      .slice(0, limit);

    return NextResponse.json({
      recipes: recipesWithMatches.map((r) => ({
        recipe: r.recipe,
        matched: r.matched,
        missing: r.missing,
        matchScore: r.matchScore,
        canMakeWithInventory: r.matchScore === 100,
      })),
      inventoryUsed: inventoryItems.length,
      totalInventory: inventoryItems.length,
      filter: {
        minMatchScore,
        maxMissing,
        category: categoryFilter,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching recipe suggestions:", error);
    return NextResponse.json(
      { error: "Failed to fetch recipe suggestions" },
      { status: 500 }
    );
  }
}
