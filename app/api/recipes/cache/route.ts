import { db } from "@/lib/db";
import { recipes, RecipeIngredient } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

interface TheMealDBRecipe {
  idMeal: string;
  strMeal: string;
  strCategory: string;
  strArea: string;
  strInstructions: string;
  strMealThumb: string;
  strYoutube: string;
  strTags: string;
  [key: string]: string; // For dynamic ingredient fields
}

/**
 * Parse ingredients from TheMealDB recipe format
 * TheMealDB uses strIngredient1-20 and strMeasure1-20 fields
 */
function parseIngredients(meal: TheMealDBRecipe): RecipeIngredient[] {
  const ingredients: RecipeIngredient[] = [];

  for (let i = 1; i <= 20; i++) {
    const ingredientKey = `strIngredient${i}`;
    const measureKey = `strMeasure${i}`;

    const ingredient = meal[ingredientKey]?.trim();
    const measure = meal[measureKey]?.trim();

    if (ingredient && ingredient.length > 0) {
      ingredients.push({
        name: ingredient,
        measure: measure || "to taste",
      });
    }
  }

  return ingredients;
}

/**
 * Fetch recipes from TheMealDB API and cache them in the database
 * Supports filtering by category
 */
export async function POST(request: Request) {
  try {
    const { categories = ["Dessert", "Vegetarian", "Seafood"], limit = 50 } =
      await request.json();

    let totalCached = 0;
    const errors: string[] = [];

    for (const category of categories) {
      try {
        // Fetch recipes by category from TheMealDB
        const response = await fetch(
          `https://www.themealdb.com/api/json/v1/1/filter.php?c=${category}`
        );

        if (!response.ok) {
          errors.push(`Failed to fetch category ${category}`);
          continue;
        }

        const data = (await response.json()) as { meals: TheMealDBRecipe[] | null };

        if (!data.meals) {
          continue;
        }

        // Fetch full details for each recipe (limited by limit)
        const recipesToCache = data.meals.slice(0, limit / categories.length);

        for (const mealSummary of recipesToCache) {
          try {
            // Fetch full meal details
            const detailResponse = await fetch(
              `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${mealSummary.idMeal}`
            );

            if (!detailResponse.ok) {
              continue;
            }

            const detailData = (await detailResponse.json()) as {
              meals: TheMealDBRecipe[];
            };

            if (!detailData.meals || detailData.meals.length === 0) {
              continue;
            }

            const meal = detailData.meals[0];
            const ingredients = parseIngredients(meal);

            // Check if already cached
            const existing = await db
              .select()
              .from(recipes)
              .where(eq(recipes.externalId, meal.idMeal));

            if (existing.length === 0) {
              await db.insert(recipes).values({
                externalId: meal.idMeal,
                source: "themealdb",
                name: meal.strMeal,
                category: meal.strCategory,
                area: meal.strArea,
                instructions: meal.strInstructions,
                imageUrl: meal.strMealThumb,
                youtubeUrl: meal.strYoutube || undefined,
                tags: meal.strTags
                  ? meal.strTags.split(",").map((t) => t.trim())
                  : [],
                ingredients,
                servings: 4,
              });
              totalCached++;
            }
          } catch (error) {
            console.error(
              `Error caching recipe ${mealSummary.idMeal}:`,
              error
            );
          }
        }
      } catch (error) {
        console.error(`Error processing category ${category}:`, error);
        errors.push(`Error processing category ${category}`);
      }
    }

    return NextResponse.json(
      {
        success: true,
        cached: totalCached,
        message: `Cached ${totalCached} recipes`,
        errors: errors.length > 0 ? errors : undefined,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error caching recipes:", error);
    return NextResponse.json(
      { error: "Failed to cache recipes" },
      { status: 500 }
    );
  }
}

/**
 * Get cache statistics
 */
export async function GET() {
  try {
    const allRecipes = await db.select().from(recipes);
    const themealdbCount = allRecipes.filter(
      (r) => r.source === "themealdb"
    ).length;
    const customCount = allRecipes.filter((r) => r.source === "custom").length;

    const categories = Array.from(
      new Set(allRecipes.map((r) => r.category).filter(Boolean))
    ) as string[];

    return NextResponse.json({
      success: true,
      totalRecipes: allRecipes.length,
      themealdbCount,
      customCount,
      categories,
      lastCachedAt: allRecipes.length > 0
        ? Math.max(...allRecipes.map((r) => r.cachedAt?.getTime() || 0))
        : null,
    });
  } catch (error) {
    console.error("Error getting cache stats:", error);
    return NextResponse.json(
      { error: "Failed to get cache statistics" },
      { status: 500 }
    );
  }
}
