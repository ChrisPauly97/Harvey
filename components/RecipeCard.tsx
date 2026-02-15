"use client";

import { Recipe } from "@/lib/schema";
import Image from "next/image";

interface RecipeCardProps {
  recipe: Recipe;
  matchScore: number;
  matchedCount: number;
  missingCount: number;
  onViewDetails: (recipe: Recipe) => void;
}

export default function RecipeCard({
  recipe,
  matchScore,
  matchedCount,
  missingCount,
  onViewDetails,
}: RecipeCardProps) {
  // Determine match color based on score
  const getMatchColor = () => {
    if (matchScore === 100) return "from-green-500 to-emerald-600";
    if (matchScore >= 75) return "from-lime-500 to-green-600";
    if (matchScore >= 50) return "from-amber-500 to-orange-600";
    return "from-red-500 to-rose-600";
  };

  const getScoreTextColor = () => {
    if (matchScore === 100) return "text-green-600 dark:text-green-400";
    if (matchScore >= 75) return "text-lime-600 dark:text-lime-400";
    if (matchScore >= 50) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <div
      onClick={() => onViewDetails(recipe)}
      className="cursor-pointer rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
    >
      {/* Recipe Image */}
      {recipe.imageUrl && (
        <div className="relative h-40 w-full overflow-hidden rounded-t-lg bg-gray-200 dark:bg-gray-700">
          <Image
            src={recipe.imageUrl}
            alt={recipe.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {/* Recipe Name & Category */}
        <div className="mb-3 flex items-start justify-between">
          <div className="flex-1">
            <h3 className="line-clamp-2 text-lg font-semibold text-gray-900 dark:text-white">
              {recipe.name}
            </h3>
            {recipe.category && (
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {recipe.category}
              </p>
            )}
          </div>
        </div>

        {/* Match Score Bar */}
        <div className="mb-3 flex items-center gap-2">
          <div className="flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className={`h-2 rounded-full bg-gradient-to-r ${getMatchColor()}`}
              style={{ width: `${matchScore}%` }}
            />
          </div>
          <span
            className={`text-sm font-bold ${getScoreTextColor()}`}
          >
            {matchScore}%
          </span>
        </div>

        {/* Ingredients Summary */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            <span className="font-semibold text-green-600 dark:text-green-400">
              {matchedCount}
            </span>
            /{recipe.ingredients?.length || 0} ingredients available
          </span>
          {missingCount > 0 && (
            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
              {missingCount} missing
            </span>
          )}
        </div>

        {/* Area & Time Info */}
        {(recipe.area || recipe.prepTime || recipe.cookTime) && (
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600 dark:text-gray-400">
            {recipe.area && (
              <span className="rounded-full bg-gray-100 px-2 py-1 dark:bg-gray-700">
                🌍 {recipe.area}
              </span>
            )}
            {recipe.prepTime && (
              <span className="rounded-full bg-gray-100 px-2 py-1 dark:bg-gray-700">
                ⏱️ {recipe.prepTime}m prep
              </span>
            )}
            {recipe.cookTime && (
              <span className="rounded-full bg-gray-100 px-2 py-1 dark:bg-gray-700">
                🍳 {recipe.cookTime}m cook
              </span>
            )}
          </div>
        )}

        {/* View Recipe Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails(recipe);
          }}
          className={`mt-4 w-full rounded-lg bg-gradient-to-r ${getMatchColor()} px-4 py-2 text-center font-semibold text-white transition-opacity hover:opacity-90`}
        >
          View Recipe
        </button>
      </div>
    </div>
  );
}
