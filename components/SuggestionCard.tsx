"use client";

import { ShoppingListItem } from "@/lib/schema";

interface SuggestionCardProps {
  suggestion: ShoppingListItem;
  onAdd: (item: ShoppingListItem) => void;
  onDismiss: (item: ShoppingListItem) => void;
}

const categoryColors: Record<string, string> = {
  fridge: "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300",
  freezer: "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300",
  pantry: "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300",
};

const priorityColors: Record<string, string> = {
  high: "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300",
  medium: "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300",
  low: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300",
};

export default function SuggestionCard({
  suggestion,
  onAdd,
  onDismiss,
}: SuggestionCardProps) {
  return (
    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            {suggestion.name}
          </h3>
          <div className="flex gap-2 flex-wrap">
            <span className={`text-xs px-2 py-1 rounded ${categoryColors[suggestion.category]}`}>
              {suggestion.category}
            </span>
            <span className={`text-xs px-2 py-1 rounded ${priorityColors[suggestion.priority]}`}>
              {suggestion.priority.charAt(0).toUpperCase() + suggestion.priority.slice(1)}
            </span>
          </div>
        </div>
      </div>

      {suggestion.notes && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          💡 {suggestion.notes}
        </p>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => onAdd(suggestion)}
          className="flex-1 px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium hover:shadow-md transition-shadow"
        >
          Add to List
        </button>
        <button
          onClick={() => onDismiss(suggestion)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
