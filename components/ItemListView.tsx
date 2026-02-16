"use client";

import { Item } from "@/lib/schema";
import Image from "next/image";
import { ItemWithChildren } from "./ItemCard";
import { useState } from "react";

interface ItemListViewProps {
  item: ItemWithChildren;
  onDelete: (id: number, reason: "finished" | "removed") => void;
  onUpdateQuantity: (id: number, action: "increment" | "decrement") => void;
  onEdit: (item: Item) => void;
}

export default function ItemListView({
  item,
  onDelete,
  onUpdateQuantity,
  onEdit,
}: ItemListViewProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate expiration status
  const getExpirationStatus = () => {
    if (!item.expirationDate) return null;
    const expirationTime = new Date(item.expirationDate).getTime();
    const now = Date.now();
    const daysUntilExpiry = (expirationTime - now) / (1000 * 60 * 60 * 24);

    if (daysUntilExpiry <= 3) return "critical";
    if (daysUntilExpiry <= 7) return "warning";
    return "normal";
  };

  const expirationStatus = getExpirationStatus();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-3 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        {/* Expand/Collapse Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-shrink-0 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          aria-label={isExpanded ? "Collapse" : "Expand"}
        >
          <svg
            className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${
              isExpanded ? "rotate-90" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>

        {/* Product Image - Only show when expanded */}
        {isExpanded && item.imageUrl && (
          <div className="relative w-12 h-12 flex-shrink-0 rounded-md overflow-hidden bg-gray-50 dark:bg-gray-900">
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              className="object-cover"
              sizes="48px"
            />
          </div>
        )}

        {/* Product Info */}
        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
              {item.name}
            </h3>
            {expirationStatus === "critical" && (
              <span className="text-red-500 text-xs">⚠️</span>
            )}
            {expirationStatus === "warning" && (
              <span className="text-orange-500 text-xs">⚠️</span>
            )}
          </div>
          {/* Only show details when expanded */}
          {isExpanded && (
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                  item.category === "fridge"
                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                    : item.category === "freezer"
                    ? "bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400"
                    : "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                }`}
              >
                {item.category === "fridge" ? "🧊" : item.category === "freezer" ? "❄️" : "🥫"}
              </span>
              {item.tags && item.tags.length > 0 && (
                <div className="flex gap-1">
                  {item.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-xs rounded"
                    >
                      {tag}
                    </span>
                  ))}
                  {item.tags.length > 2 && (
                    <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-xs rounded">
                      +{item.tags.length - 2}
                    </span>
                  )}
                </div>
              )}
              {item.portionSize && (
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  📦 {item.portionSize}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Usage Level Indicator - Only show when expanded */}
        {isExpanded && item.usageLevel !== undefined && item.usageLevel !== null && (
          <div className="flex-shrink-0 w-16">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all"
                style={{ width: `${item.usageLevel}%` }}
              ></div>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-500 block text-center mt-0.5">
              {item.usageLevel}%
            </span>
          </div>
        )}

        {/* Compact Quantity and Action Buttons - Always visible */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {/* Decrement */}
          <button
            onClick={() => onUpdateQuantity(item.id, "decrement")}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 font-bold text-xs transition-colors"
            aria-label="Decrease quantity"
            title="Decrease quantity"
          >
            −
          </button>

          {/* Quantity Display */}
          <span className="font-semibold text-xs px-1.5 min-w-[1.5rem] text-center text-gray-700 dark:text-gray-300">
            {item.quantity}
          </span>

          {/* Increment */}
          <button
            onClick={() => onUpdateQuantity(item.id, "increment")}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 font-bold text-xs transition-colors"
            aria-label="Increase quantity"
            title="Increase quantity"
          >
            +
          </button>

          {/* Divider */}
          <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-0.5"></div>

          {/* Remove Button - Red X */}
          <button
            onClick={() => onDelete(item.id, "removed")}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-500 transition-colors"
            title="Remove item"
            aria-label="Remove item"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Finished Button - Trashcan */}
          <button
            onClick={() => onDelete(item.id, "finished")}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
            title="Mark as finished"
            aria-label="Mark as finished"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
