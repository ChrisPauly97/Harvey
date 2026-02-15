"use client";

import { ShoppingListItem } from "@/lib/schema";

interface ShoppingListItemCardProps {
  item: ShoppingListItem;
  onTogglePurchased: (item: ShoppingListItem, isPurchased: boolean) => void;
  onDelete: (item: ShoppingListItem) => void;
}

const categoryColors: Record<string, string> = {
  fridge: "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300",
  freezer: "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300",
  pantry: "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300",
};

export default function ShoppingListItemCard({
  item,
  onTogglePurchased,
  onDelete,
}: ShoppingListItemCardProps) {
  return (
    <div
      className={`p-4 border rounded-lg transition-all ${
        item.isPurchased
          ? "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700"
          : "border-gray-200 dark:border-gray-700 hover:shadow-md"
      }`}
    >
      <div className="flex gap-3 items-start">
        <input
          type="checkbox"
          checked={item.isPurchased}
          onChange={(e) => onTogglePurchased(item, e.target.checked)}
          className="mt-1.5 w-5 h-5 rounded cursor-pointer accent-green-500"
        />
        <div className="flex-1">
          <h3
            className={`font-semibold ${
              item.isPurchased
                ? "line-through text-gray-500 dark:text-gray-400"
                : "text-gray-900 dark:text-white"
            }`}
          >
            {item.name}
          </h3>
          <div className="flex gap-2 mt-2">
            <span className={`text-xs px-2 py-1 rounded ${categoryColors[item.category]}`}>
              {item.category}
            </span>
            {item.source === "recurring" && (
              <span className="text-xs px-2 py-1 rounded bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                🔁 Recurring
              </span>
            )}
            {item.source === "auto_suggestion" && (
              <span className="text-xs px-2 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                💡 Suggested
              </span>
            )}
          </div>
          {item.notes && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{item.notes}</p>
          )}
        </div>
        <button
          onClick={() => onDelete(item)}
          className="px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          aria-label="Delete item"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}
