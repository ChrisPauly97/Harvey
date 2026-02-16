"use client";

import { Item } from "@/lib/schema";
import Image from "next/image";
import { useRef, useState } from "react";

// Extended type for items with child count
export type ItemWithChildren = Item & { childCount: number };

interface ItemCardProps {
  item: ItemWithChildren;
  onDelete: (id: number, reason: "finished" | "removed") => void;
  onUpdateQuantity: (id: number, action: "increment" | "decrement") => void;
  onSplit: (item: Item) => void;
  onEdit: (item: Item) => void;
}

export default function ItemCard({
  item,
  onDelete,
  onUpdateQuantity,
  onSplit,
  onEdit,
}: ItemCardProps) {
  const [isEditingQuantity, setIsEditingQuantity] = useState(false);
  const [editQuantity, setEditQuantity] = useState(item.quantity.toString());
  const [isUpdating, setIsUpdating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleQuantityClick = () => {
    setIsEditingQuantity(true);
    setEditQuantity(item.quantity.toString());
    // Focus input after state update
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const saveQuantity = async () => {
    const newQuantity = parseInt(editQuantity, 10);

    // Validate
    if (isNaN(newQuantity) || newQuantity < 0) {
      setIsEditingQuantity(false);
      return;
    }

    if (newQuantity === item.quantity) {
      setIsEditingQuantity(false);
      return;
    }

    setIsUpdating(true);

    try {
      const response = await fetch(`/api/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: newQuantity }),
      });

      if (response.ok) {
        // Refresh the page to see updated quantity
        window.location.reload();
      } else {
        setEditQuantity(item.quantity.toString());
      }
    } catch (error) {
      console.error("Failed to update quantity:", error);
      setEditQuantity(item.quantity.toString());
    } finally {
      setIsUpdating(false);
      setIsEditingQuantity(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      saveQuantity();
    } else if (e.key === "Escape") {
      setIsEditingQuantity(false);
    }
  };
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
      <div className="flex gap-4">
        {/* Product Image */}
        {item.imageUrl && (
          <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900">
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              className="object-cover"
              sizes="80px"
            />
          </div>
        )}

        {/* Product Info */}
        <div className="flex-grow min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100 leading-tight">
              {item.name}
            </h3>
            <span
              className={`px-2 py-1 rounded-md text-xs font-medium flex-shrink-0 ${
                item.category === "fridge"
                  ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
                  : item.category === "freezer"
                  ? "bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800"
                  : "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
              }`}
            >
              {item.category === "fridge" ? "Fridge" : item.category === "freezer" ? "Freezer" : "Pantry"}
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            {item.barcode}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {new Date(item.addedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>

          {/* Portion Info */}
          {item.portionSize && (
            <div className="mt-2">
              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                📦 Portion: {item.portionSize}
              </span>
            </div>
          )}

          {/* Parent Link (for portions) */}
          {item.parentId && (
            <div className="mt-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                🔗 Split portion
              </span>
            </div>
          )}

          {/* Child Count (for parents with portions) */}
          {item.childCount > 0 && (
            <div className="mt-2">
              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                👶 {item.childCount} portion{item.childCount > 1 ? "s" : ""} created
              </span>
            </div>
          )}

          {/* Expiration Date */}
          {item.expirationDate && (() => {
            const expirationTime = new Date(item.expirationDate).getTime();
            const now = Date.now();
            const daysUntilExpiry = (expirationTime - now) / (1000 * 60 * 60 * 24);

            return (
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`text-xs font-medium px-2 py-1 rounded ${
                    daysUntilExpiry <= 3
                      ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                      : daysUntilExpiry <= 7
                      ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  Expires: {new Date(item.expirationDate).toLocaleDateString()}
                </span>
              </div>
            );
          })()}

          {/* Brand */}
          {item.brand && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Brand: {item.brand}
            </p>
          )}

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-xs rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Usage Level */}
          {item.usageLevel !== undefined && item.usageLevel !== null && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Fullness
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-500">
                  {item.usageLevel}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div
                  className="bg-emerald-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${item.usageLevel}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quantity Controls & Action Buttons */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-900 rounded-lg p-1">
          <button
            onClick={() => onUpdateQuantity(item.id, "decrement")}
            disabled={isEditingQuantity}
            className="w-9 h-9 flex items-center justify-center rounded-md bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-500 font-bold text-lg shadow-sm transition-colors disabled:opacity-50"
            aria-label="Decrease quantity"
          >
            −
          </button>
          {isEditingQuantity ? (
            <input
              ref={inputRef}
              type="number"
              min="0"
              value={editQuantity}
              onChange={(e) => setEditQuantity(e.target.value)}
              onBlur={saveQuantity}
              onKeyDown={handleKeyDown}
              disabled={isUpdating}
              className="font-semibold text-lg px-2 w-16 text-center bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded border-2 border-emerald-500 focus:outline-none"
            />
          ) : (
            <span
              onClick={handleQuantityClick}
              className="font-semibold text-lg px-4 min-w-[3rem] text-center text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
              title="Click to edit quantity"
            >
              {item.quantity}
            </span>
          )}
          <button
            onClick={() => onUpdateQuantity(item.id, "increment")}
            disabled={isEditingQuantity}
            className="w-9 h-9 flex items-center justify-center rounded-md bg-white dark:bg-gray-800 hover:bg-green-50 dark:hover:bg-green-900/30 text-green-600 dark:text-green-500 font-bold text-lg shadow-sm transition-colors disabled:opacity-50"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Edit Button */}
          <button
            onClick={() => onEdit(item)}
            className="border-2 border-blue-500 text-blue-600 dark:text-blue-400 px-3 py-2 rounded-lg font-medium text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors shadow-sm"
          >
            ✏️ Edit
          </button>
          {/* Split Button - only for original items with quantity >= 2 */}
          {item.quantity >= 2 && !item.parentId && (
            <button
              onClick={() => onSplit(item)}
              className="border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 px-3 py-2 rounded-lg font-medium text-sm hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors shadow-sm"
            >
              📦 Split
            </button>
          )}
          <button
            onClick={() => onDelete(item.id, "finished")}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-all shadow-sm"
          >
            ✓ Finished
          </button>
          <button
            onClick={() => onDelete(item.id, "removed")}
            className="bg-red-500 hover:bg-red-600 active:bg-red-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm"
          >
            🗑️ Remove
          </button>
        </div>
      </div>
    </div>
  );
}
