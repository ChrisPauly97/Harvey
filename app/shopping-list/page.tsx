"use client";

import { useEffect, useState } from "react";
import SuggestionCard from "@/components/SuggestionCard";
import ShoppingListItemCard from "@/components/ShoppingListItemCard";
import { ShoppingListItem } from "@/lib/schema";

export default function ShoppingListPage() {
  const [suggestions, setSuggestions] = useState<ShoppingListItem[]>([]);
  const [manualItems, setManualItems] = useState<ShoppingListItem[]>([]);
  const [recurringItems, setRecurringItems] = useState<ShoppingListItem[]>([]);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState<"suggestions" | "my-list">("suggestions");
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState<"fridge" | "freezer" | "pantry">(
    "pantry"
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchShoppingList();
  }, []);

  async function fetchShoppingList() {
    try {
      setLoading(true);
      const response = await fetch("/api/shopping-list");
      if (!response.ok) throw new Error("Failed to fetch shopping list");

      const data = await response.json();
      setSuggestions(data.suggestions || []);
      setManualItems(data.manual || []);
      setRecurringItems(data.recurring || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching shopping list:", err);
      setError("Failed to load shopping list");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddSuggestion(suggestion: ShoppingListItem) {
    try {
      const response = await fetch("/api/shopping-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barcode: suggestion.barcode,
          name: suggestion.name,
          category: suggestion.category,
          source: "manual",
          priority: suggestion.priority,
          notes: suggestion.notes,
        }),
      });

      if (!response.ok) throw new Error("Failed to add item");

      const newItem = await response.json();
      setManualItems([newItem, ...manualItems]);
      setSuggestions(suggestions.filter((s) => s.name !== suggestion.name));
      setDismissedSuggestions((prev) => new Set(prev).add(suggestion.id));
    } catch (err) {
      console.error("Error adding suggestion:", err);
      setError("Failed to add item");
    }
  }

  async function handleDismissSuggestion(suggestion: ShoppingListItem) {
    setDismissedSuggestions((prev) => new Set(prev).add(suggestion.id));
    setSuggestions(suggestions.filter((s) => s.name !== suggestion.name));
  }

  async function handleTogglePurchased(item: ShoppingListItem, isPurchased: boolean) {
    try {
      const response = await fetch(`/api/shopping-list/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPurchased }),
      });

      if (!response.ok) throw new Error("Failed to update item");

      const updated = await response.json();

      if (item.source === "manual") {
        setManualItems(manualItems.map((i) => (i.id === item.id ? updated : i)));
      } else if (item.source === "recurring") {
        setRecurringItems(recurringItems.map((i) => (i.id === item.id ? updated : i)));
      }
    } catch (err) {
      console.error("Error updating item:", err);
      setError("Failed to update item");
    }
  }

  async function handleDelete(item: ShoppingListItem) {
    try {
      const response = await fetch(`/api/shopping-list/${item.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete item");

      if (item.source === "manual") {
        setManualItems(manualItems.filter((i) => i.id !== item.id));
      } else if (item.source === "recurring") {
        setRecurringItems(recurringItems.filter((i) => i.id !== item.id));
      }
    } catch (err) {
      console.error("Error deleting item:", err);
      setError("Failed to delete item");
    }
  }

  async function handleAddManualItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newItemName.trim()) return;

    try {
      const response = await fetch("/api/shopping-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newItemName,
          category: newItemCategory,
          source: "manual",
        }),
      });

      if (!response.ok) throw new Error("Failed to add item");

      const newItem = await response.json();
      setManualItems([newItem, ...manualItems]);
      setNewItemName("");
    } catch (err) {
      console.error("Error adding item:", err);
      setError("Failed to add item");
    }
  }

  const unpurchasedCount = manualItems.filter((i) => !i.isPurchased).length +
    recurringItems.filter((i) => !i.isPurchased).length;
  const visibleSuggestions = suggestions.filter((s) => !dismissedSuggestions.has(s.id));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-600 dark:text-gray-400">Loading shopping list...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">🛒 Shopping List</h1>
            {unpurchasedCount > 0 && (
              <span className="inline-flex items-center justify-center px-3 py-1 text-sm font-bold text-white bg-red-500 rounded-full">
                {unpurchasedCount}
              </span>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg mb-4">
              {error}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("suggestions")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === "suggestions"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              💡 Suggestions {visibleSuggestions.length > 0 && `(${visibleSuggestions.length})`}
            </button>
            <button
              onClick={() => setActiveTab("my-list")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === "my-list"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              📝 My List {manualItems.length > 0 && `(${manualItems.length})`}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Suggestions Tab */}
        {activeTab === "suggestions" && (
          <div>
            {visibleSuggestions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-2xl mb-2">✨</p>
                <p className="text-gray-600 dark:text-gray-400">
                  {suggestions.length === 0
                    ? "No suggestions yet. Keep using your items to get personalized suggestions!"
                    : "All suggestions have been added or dismissed!"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {visibleSuggestions.map((suggestion) => (
                  <SuggestionCard
                    key={suggestion.id}
                    suggestion={suggestion}
                    onAdd={handleAddSuggestion}
                    onDismiss={handleDismissSuggestion}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* My List Tab */}
        {activeTab === "my-list" && (
          <div>
            {/* Add New Item Form */}
            <form onSubmit={handleAddManualItem} className="mb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Add new item..."
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
                <select
                  value={newItemCategory}
                  onChange={(e) => setNewItemCategory(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="fridge">Fridge</option>
                  <option value="freezer">Freezer</option>
                  <option value="pantry">Pantry</option>
                </select>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium hover:shadow-md transition-shadow"
                >
                  +
                </button>
              </div>
            </form>

            {/* Manual Items */}
            {manualItems.length === 0 && recurringItems.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-2xl mb-2">📝</p>
                <p className="text-gray-600 dark:text-gray-400">
                  Your shopping list is empty. Add items to get started!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {manualItems.length > 0 && (
                  <>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Your Items
                    </h2>
                    <div className="space-y-3">
                      {manualItems.map((item) => (
                        <ShoppingListItemCard
                          key={item.id}
                          item={item}
                          onTogglePurchased={handleTogglePurchased}
                          onDelete={handleDelete}
                        />
                      ))}
                    </div>
                  </>
                )}

                {recurringItems.length > 0 && (
                  <>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 mt-6">
                      🔁 Recurring Items
                    </h2>
                    <div className="space-y-3">
                      {recurringItems.map((item) => (
                        <ShoppingListItemCard
                          key={item.id}
                          item={item}
                          onTogglePurchased={handleTogglePurchased}
                          onDelete={handleDelete}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
