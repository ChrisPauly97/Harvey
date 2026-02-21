"use client";

import { useEffect, useState } from "react";
import RecipeCard from "@/components/RecipeCard";
import RecipeDetailModal from "@/components/RecipeDetailModal";
import { Recipe, RecipeIngredient } from "@/lib/schema";
import { IngredientMatch } from "@/lib/matching";

interface RecipeWithMatch {
  recipe: Recipe;
  matched: IngredientMatch[];
  missing: RecipeIngredient[];
  matchScore: number;
  canMakeWithInventory: boolean;
}

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<RecipeWithMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [selectedRecipeMatches, setSelectedRecipeMatches] = useState<{
    matched: IngredientMatch[];
    missing: RecipeIngredient[];
  }>({ matched: [], missing: [] });
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [categories, setCategories] = useState<string[]>([]);

  // Fetch recipes on mount and when filter changes
  useEffect(() => {
    async function fetchRecipes() {
      setLoading(true);
      setError(null);

      try {
        let url = "/api/recipes/suggestions?limit=50&minMatchScore=75";
        if (filterCategory) {
          url += `&category=${encodeURIComponent(filterCategory)}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch recipes");
        }

        setRecipes(data.recipes || []);

        // Extract unique categories from all recipes (on first load)
        if (categories.length === 0 && data.recipes) {
          const uniqueCategories = Array.from(
            new Set(data.recipes.map((r: RecipeWithMatch) => r.recipe.category).filter(Boolean))
          ) as string[];
          setCategories(uniqueCategories);
        }
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to fetch recipes"
        );
        setRecipes([]);
      } finally {
        setLoading(false);
      }
    }

    fetchRecipes();
  }, [filterCategory]);

  const handleViewDetails = (recipe: Recipe) => {
    setSelectedRecipe(recipe);

    // Find the matching data for this recipe
    const recipeData = recipes.find((r) => r.recipe.id === recipe.id);
    if (recipeData) {
      setSelectedRecipeMatches({
        matched: recipeData.matched,
        missing: recipeData.missing,
      });
    }

    setDetailModalOpen(true);
  };

  const handleAddMissingToShoppingList = async (
    ingredients: RecipeIngredient[]
  ) => {
    const results = await Promise.allSettled(
      ingredients.map((ingredient) =>
        fetch("/api/shopping-list", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `${ingredient.name} (${ingredient.measure})`,
            category: "pantry",
            source: "manual",
            priority: "medium",
            notes: selectedRecipe
              ? `Needed for recipe: ${selectedRecipe.name}`
              : "From recipe",
          }),
        })
      )
    );

    const failed = results.filter((r) => r.status === "rejected").length;
    if (failed > 0) {
      throw new Error(
        `Failed to add ${failed} item${failed !== 1 ? "s" : ""} to shopping list`
      );
    }

    // Close modal on success
    setDetailModalOpen(false);
  };

  if (!loading && error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white p-4 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
            Oops! Error loading recipes
          </h1>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
          {error.includes("No recipes cached") && (
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-500">
              Run the cache endpoint to populate recipes with: POST /api/recipes/cache
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24 dark:bg-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-gray-200 bg-white px-4 py-6 dark:border-gray-700 dark:bg-gray-800 sm:px-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          🍳 Recipes
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Find recipes you can make with your current inventory
        </p>

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => setFilterCategory("")}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                filterCategory === ""
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              All
            </button>
            {categories.slice(0, 5).map((category) => (
              <button
                key={category}
                onClick={() => setFilterCategory(category)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  filterCategory === category
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 py-6 sm:px-6">
        {loading ? (
          // Loading Skeleton
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"
                style={{ height: "360px" }}
              />
            ))}
          </div>
        ) : recipes.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 py-12 dark:border-gray-600 dark:bg-gray-800">
            <div className="text-5xl">🍽️</div>
            <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
              No recipes match your inventory
            </h2>
            <p className="mt-2 text-center text-gray-600 dark:text-gray-400">
              {filterCategory
                ? `Try a different category or add more items to your inventory`
                : `You might need to add more items to your inventory to find matching recipes`}
            </p>
            {filterCategory && (
              <button
                onClick={() => setFilterCategory("")}
                className="mt-4 rounded-lg bg-orange-500 px-4 py-2 font-semibold text-white hover:bg-orange-600"
              >
                View all recipes
              </button>
            )}
          </div>
        ) : (
          // Recipe Grid
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recipes.map((item) => (
              <RecipeCard
                key={item.recipe.id}
                recipe={item.recipe}
                matchScore={item.matchScore}
                matchedCount={item.matched.length}
                missingCount={item.missing.length}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recipe Detail Modal */}
      <RecipeDetailModal
        recipe={selectedRecipe}
        matched={selectedRecipeMatches.matched}
        missing={selectedRecipeMatches.missing}
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        onAddMissingToShoppingList={handleAddMissingToShoppingList}
      />
    </div>
  );
}
