"use client";

import { CoffeeWithBrewCount } from "@/lib/schema";

interface CoffeeCardProps {
  coffee: CoffeeWithBrewCount;
  onEdit: (coffee: CoffeeWithBrewCount) => void;
  onDelete: (id: number) => void;
  onToggleActive: (id: number, isActive: boolean) => void;
  onLogBrew: (coffeeId: number) => void;
}

const roastLevelColors: Record<string, string> = {
  light: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  medium: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  "medium-dark": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  dark: "bg-stone-700 text-stone-100 dark:bg-stone-900 dark:text-stone-200",
};

function daysSinceRoast(roastDate: string | null): number | null {
  if (!roastDate) return null;
  const roast = new Date(roastDate);
  const now = new Date();
  return Math.floor((now.getTime() - roast.getTime()) / (1000 * 60 * 60 * 24));
}

export default function CoffeeCard({ coffee, onEdit, onDelete, onToggleActive, onLogBrew }: CoffeeCardProps) {
  const days = daysSinceRoast(coffee.roastDate);

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col gap-3 ${
        !coffee.isActive ? "opacity-60" : ""
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight truncate">
            {coffee.name}
          </h3>
          {coffee.roaster && (
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{coffee.roaster}</p>
          )}
        </div>
        <span
          className={`shrink-0 text-xs font-semibold px-2 py-1 rounded-full ${
            coffee.isActive
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
          }`}
        >
          {coffee.isActive ? "Active" : "Finished"}
        </span>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap gap-1.5">
        {coffee.origin && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
            {coffee.origin}
          </span>
        )}
        {coffee.roastLevel && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roastLevelColors[coffee.roastLevel]}`}>
            {coffee.roastLevel.charAt(0).toUpperCase() + coffee.roastLevel.slice(1)} roast
          </span>
        )}
        {coffee.process && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300">
            {coffee.process}
          </span>
        )}
      </div>

      {/* Variety */}
      {coffee.variety && (
        <p className="text-xs text-gray-500 dark:text-gray-400 italic">{coffee.variety}</p>
      )}

      {/* Roast date */}
      {coffee.roastDate && (
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Roasted{" "}
          <span className="font-medium">
            {new Date(coffee.roastDate).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
          {days !== null && (
            <span
              className={`ml-1 ${
                days <= 7
                  ? "text-green-600 dark:text-green-400"
                  : days <= 30
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-red-500 dark:text-red-400"
              }`}
            >
              ({days === 0 ? "today" : `${days}d ago`})
            </span>
          )}
        </p>
      )}

      {/* Description */}
      {coffee.description && (
        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{coffee.description}</p>
      )}

      {/* Brew count */}
      <div className="text-xs text-gray-500 dark:text-gray-400">
        {coffee.brewCount === 0
          ? "No brews yet"
          : `${coffee.brewCount} brew${coffee.brewCount === 1 ? "" : "s"}`}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-100 dark:border-gray-700">
        <button
          onClick={() => onLogBrew(coffee.id)}
          className="flex-1 py-1.5 px-3 text-xs font-medium rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 transition-colors"
        >
          ☕ Log Brew
        </button>
        <button
          onClick={() => onToggleActive(coffee.id, !coffee.isActive)}
          className="py-1.5 px-3 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          {coffee.isActive ? "Finish" : "Reactivate"}
        </button>
        <button
          onClick={() => onEdit(coffee)}
          className="py-1.5 px-3 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(coffee.id)}
          className="py-1.5 px-3 text-xs font-medium rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
