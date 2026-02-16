"use client";

import { Item } from "@/lib/schema";
import Image from "next/image";
import { ItemWithChildren } from "./ItemCard";

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
        {/* Product Image */}
        {item.imageUrl && (
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
        </div>

        {/* Usage Level Indicator */}
        {item.usageLevel !== undefined && item.usageLevel !== null && (
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

        {/* Quantity Controls */}
        <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-900 rounded-lg p-1 flex-shrink-0">
          <button
            onClick={() => onUpdateQuantity(item.id, "decrement")}
            className="w-7 h-7 flex items-center justify-center rounded-md bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-500 font-bold text-sm shadow-sm transition-colors"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="font-semibold text-sm px-2 min-w-[2rem] text-center text-gray-900 dark:text-gray-100">
            {item.quantity}
          </span>
          <button
            onClick={() => onUpdateQuantity(item.id, "increment")}
            className="w-7 h-7 flex items-center justify-center rounded-md bg-white dark:bg-gray-800 hover:bg-green-50 dark:hover:bg-green-900/30 text-green-600 dark:text-green-500 font-bold text-sm shadow-sm transition-colors"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onEdit(item)}
            className="p-2 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            title="Edit item"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            onClick={() => onDelete(item.id, "finished")}
            className="p-2 rounded-lg text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
            title="Mark as finished"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </button>
          <button
            onClick={() => onDelete(item.id, "removed")}
            className="p-2 rounded-lg text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Remove item"
          >
            <svg
              className="w-4 h-4"
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
