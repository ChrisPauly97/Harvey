"use client";

import { Recipe, RecipeIngredient } from "@/lib/schema";
import { IngredientMatch } from "@/lib/matching";
import Image from "next/image";
import { useState } from "react";

interface RecipeDetailModalProps {
  recipe: Recipe | null;
  matched: IngredientMatch[];
  missing: RecipeIngredient[];
  isOpen: boolean;
  onClose: () => void;
  onAddMissingToShoppingList?: (ingredients: RecipeIngredient[]) => Promise<void>;
}

export default function RecipeDetailModal({
  recipe,
  matched,
  missing,
  isOpen,
  onClose,
  onAddMissingToShoppingList,
}: RecipeDetailModalProps) {
  const [isAddingToList, setIsAddingToList] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  if (!isOpen || !recipe) {
    return null;
  }

  const handleAddMissingToList = async () => {
    if (!onAddMissingToShoppingList || missing.length === 0) return;

    setIsAddingToList(true);
    setAddError(null);

    try {
      await onAddMissingToShoppingList(missing);
      // Optionally show success message
    } catch (error) {
      setAddError(
        error instanceof Error
          ? error.message
          : "Failed to add items to shopping list"
      );
    } finally {
      setIsAddingToList(false);
    }
  };

  const matchScore =
    matched.length + missing.length > 0
      ? Math.round((matched.length / (matched.length + missing.length)) * 100)
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end overflow-y-auto bg-black bg-opacity-50 sm:items-center sm:justify-center">
      {/* Modal */}
      <div className="w-full max-w-2xl rounded-t-lg bg-white sm:rounded-lg dark:bg-gray-800">
        {/* Sticky Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Recipe Details
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <span className="text-2xl">×</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="max-h-[calc(100vh-200px)] overflow-y-auto sm:max-h-[calc(100vh-300px)]">
          {/* Recipe Image */}
          {recipe.imageUrl && (
            <div className="relative h-48 w-full bg-gray-200 dark:bg-gray-700 sm:h-64">
              <Image
                src={recipe.imageUrl}
                alt={recipe.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 768px"
              />
            </div>
          )}

          <div className="p-4 sm:p-6">
            {/* Recipe Name & Category */}
            <div className="mb-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {recipe.name}
              </h1>
              <div className="mt-2 flex flex-wrap gap-2">
                {recipe.category && (
                  <span className="inline-block rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                    {recipe.category}
                  </span>
                )}
                {recipe.area && (
                  <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {recipe.area}
                  </span>
                )}
                {recipe.servings && (
                  <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                    Serves {recipe.servings}
                  </span>
                )}
              </div>
            </div>

            {/* Match Score */}
            <div className="mb-6 rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-semibold text-gray-900 dark:text-white">
                  Match Score
                </span>
                <span className="text-lg font-bold text-green-600 dark:text-green-400">
                  {matchScore}%
                </span>
              </div>
              <div className="overflow-hidden rounded-full bg-gray-200 dark:bg-gray-600">
                <div
                  className="h-2 bg-gradient-to-r from-green-500 to-emerald-600"
                  style={{ width: `${matchScore}%` }}
                />
              </div>
            </div>

            {/* Ingredients List */}
            <div className="mb-6">
              <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
                Ingredients ({matched.length + missing.length})
              </h3>

              {/* Matched Ingredients */}
              {matched.length > 0 && (
                <div className="mb-4">
                  <h4 className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                    You Have ({matched.length})
                  </h4>
                  <ul className="space-y-2">
                    {matched.map((match, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-3 rounded-lg bg-green-50 p-2 dark:bg-green-900/30"
                      >
                        <span className="mt-0.5 text-lg">✅</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {match.recipeIngredient.name}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {match.recipeIngredient.measure}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            Found: {match.inventoryItem.name}
                            {match.matchType === "exact" && " (exact)"}
                            {match.matchType === "partial" && " (partial)"}
                            {match.matchType === "fuzzy" && " (fuzzy)"}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Missing Ingredients */}
              {missing.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                    You Need ({missing.length})
                  </h4>
                  <ul className="space-y-2">
                    {missing.map((ingredient, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-3 rounded-lg bg-red-50 p-2 dark:bg-red-900/30"
                      >
                        <span className="mt-0.5 text-lg">❌</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {ingredient.name}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {ingredient.measure}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Instructions */}
            {recipe.instructions && (
              <div className="mb-6">
                <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
                  Instructions
                </h3>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                  {recipe.instructions}
                </p>
              </div>
            )}

            {/* Additional Info */}
            {(recipe.prepTime || recipe.cookTime || recipe.youtubeUrl) && (
              <div className="mb-6 rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
                {recipe.prepTime && (
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    ⏱️ <span className="font-medium">Prep time:</span> {recipe.prepTime} minutes
                  </p>
                )}
                {recipe.cookTime && (
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    🍳 <span className="font-medium">Cook time:</span> {recipe.cookTime} minutes
                  </p>
                )}
                {recipe.youtubeUrl && (
                  <a
                    href={recipe.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                  >
                    📺 Watch on YouTube
                  </a>
                )}
              </div>
            )}

            {/* Error Message */}
            {addError && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 dark:bg-red-900/30">
                <p className="text-sm text-red-700 dark:text-red-400">
                  {addError}
                </p>
              </div>
            )}

            {/* Add to Shopping List Button */}
            {missing.length > 0 && onAddMissingToShoppingList && (
              <button
                onClick={handleAddMissingToList}
                disabled={isAddingToList}
                className="mb-4 w-full rounded-lg bg-gradient-to-r from-orange-500 to-red-500 px-4 py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isAddingToList
                  ? "Adding to shopping list..."
                  : `Add ${missing.length} missing ingredient${missing.length !== 1 ? "s" : ""} to shopping list`}
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-gray-200 px-4 py-2 font-semibold text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
