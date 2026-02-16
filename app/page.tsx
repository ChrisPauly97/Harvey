"use client";

import ItemCard, { ItemWithChildren } from "@/components/ItemCard";
import ItemListView from "@/components/ItemListView";
import SplitItemModal, { SplitData } from "@/components/SplitItemModal";
import EditItemModal from "@/components/EditItemModal";
import ThemeToggle from "@/components/ThemeToggle";
import { Item } from "@/lib/schema";
import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";

// SWR fetcher function
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Home() {
  const [filter, setFilter] = useState<"all" | "fridge" | "freezer" | "pantry">("all");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [sortBy, setSortBy] = useState<"default" | "expiryDate" | "addedDate" | "alphabetical">("default");
  const [splitModalOpen, setSplitModalOpen] = useState(false);
  const [itemToSplit, setItemToSplit] = useState<Item | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<Item | null>(null);

  // Use SWR for data fetching with automatic caching and revalidation
  const { data: items = [], error, isLoading, mutate } = useSWR<ItemWithChildren[]>(
    "/api/items",
    fetcher,
    {
      revalidateOnFocus: true, // Revalidate when window regains focus
      revalidateOnReconnect: true, // Revalidate when browser regains network connection
      dedupingInterval: 2000, // Dedupe requests within 2 seconds
    }
  );

  const loading = isLoading;

  const handleDelete = async (id: number, reason: "finished" | "removed") => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    const actionText = reason === "finished" ? "mark as finished" : "remove";
    const confirmText =
      reason === "finished"
        ? `Mark all ${item.quantity} ${item.quantity === 1 ? "item" : "items"} of "${item.name}" as finished? This will be recorded in your consumption history.`
        : `Remove all ${item.quantity} ${item.quantity === 1 ? "item" : "items"} of "${item.name}"? This will NOT be recorded in consumption history (use Finished if you consumed the item).`;

    const confirmed = window.confirm(confirmText);

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/items/${id}?reason=${reason}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (response.status === 409 && result.error === "has_children") {
        // Parent has children - show cascade confirmation
        const cascadeConfirmed = window.confirm(
          `This item has ${result.count} split portion${
            result.count > 1 ? "s" : ""
          }. ${actionText === "mark as finished" ? "Mark" : "Delete"} all portions too?`
        );

        if (!cascadeConfirmed) return;

        // Cascade delete
        const cascadeRes = await fetch(`/api/items/${id}?cascade=true&reason=${reason}`, {
          method: "DELETE",
        });

        if (!cascadeRes.ok) throw new Error("Failed to delete");
      } else if (!response.ok) {
        throw new Error("Failed to delete item");
      }

      // Revalidate SWR cache
      mutate();
    } catch (err) {
      alert(`Failed to ${actionText}. Please try again.`);
      console.error(err);
    }
  };

  const handleUpdateQuantity = async (
    id: number,
    action: "increment" | "decrement"
  ) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    if (action === "decrement" && item.quantity === 1) {
      const confirmed = window.confirm(
        `This will remove "${item.name}" from your inventory. Continue?`
      );
      if (!confirmed) return;
    }

    try {
      const response = await fetch(`/api/items/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) throw new Error("Failed to update quantity");

      // Revalidate SWR cache
      mutate();
    } catch (err) {
      alert("Failed to update quantity. Please try again.");
      console.error(err);
    }
  };

  const handleSplit = (item: Item) => {
    setItemToSplit(item);
    setSplitModalOpen(true);
  };

  const handleSplitConfirm = async (data: SplitData) => {
    if (!itemToSplit) return;

    try {
      const res = await fetch(`/api/items/${itemToSplit.id}/split`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.error || "Failed to split item");

      // Revalidate SWR cache
      mutate();

      setSplitModalOpen(false);
      setItemToSplit(null);
    } catch (error) {
      throw error; // Let modal handle the error display
    }
  };

  const handleEdit = (item: Item) => {
    setItemToEdit(item);
    setEditModalOpen(true);
  };

  const handleEditSave = async (id: number, updates: Partial<Item>) => {
    try {
      const response = await fetch(`/api/items/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error("Failed to update item");

      // Revalidate SWR cache
      mutate();
    } catch (err) {
      throw new Error("Failed to save changes. Please try again.");
    }
  };

  // Extract unique tags from all items
  const allTags = Array.from(
    new Set(items.flatMap((item) => item.tags || []))
  ).sort();

  const filteredItems = items.filter((item) => {
    // Category filter
    if (filter !== "all" && item.category !== filter) return false;
    // Tag filter
    if (tagFilter && (!item.tags || !item.tags.includes(tagFilter))) return false;
    return true;
  });

  // Sort filtered items
  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case "expiryDate":
        // Items without expiry date go last
        if (!a.expirationDate && !b.expirationDate) return 0;
        if (!a.expirationDate) return 1;
        if (!b.expirationDate) return -1;
        return new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime();

      case "addedDate":
        // Newest first
        return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();

      case "alphabetical":
        return a.name.localeCompare(b.name);

      default:
        // Default: sort by ID (newest first)
        return b.id - a.id;
    }
  });

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-2xl shadow-md">
                🍽️
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Harvey
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link
                href="/scan"
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-2"
              >
                <span className="text-lg">+</span> Add Item
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* View Mode Toggle */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Inventory
          </h2>
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setViewMode("card")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === "card"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
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
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === "list"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
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
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Category Filter Buttons */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all flex-shrink-0 ${
              filter === "all"
                ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
            }`}
          >
            All <span className="opacity-70">({items.length})</span>
          </button>
          <button
            onClick={() => setFilter("fridge")}
            className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all flex-shrink-0 ${
              filter === "fridge"
                ? "bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-md"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
            }`}
          >
            🧊 Fridge{" "}
            <span className="opacity-70">
              ({items.filter((i) => i.category === "fridge").length})
            </span>
          </button>
          <button
            onClick={() => setFilter("freezer")}
            className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all flex-shrink-0 ${
              filter === "freezer"
                ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
            }`}
          >
            ❄️ Freezer{" "}
            <span className="opacity-70">
              ({items.filter((i) => i.category === "freezer").length})
            </span>
          </button>
          <button
            onClick={() => setFilter("pantry")}
            className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all flex-shrink-0 ${
              filter === "pantry"
                ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
            }`}
          >
            🥫 Pantry{" "}
            <span className="opacity-70">
              ({items.filter((i) => i.category === "pantry").length})
            </span>
          </button>
        </div>

        {/* Tag Filter Buttons */}
        {allTags.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Filter by tag:
              </span>
              {tagFilter && (
                <button
                  onClick={() => setTagFilter(null)}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline"
                >
                  Clear filter
                </button>
              )}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setTagFilter(tag === tagFilter ? null : tag)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex-shrink-0 ${
                    tagFilter === tag
                      ? "bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md"
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sort Options */}
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Sort by:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-2 rounded-lg text-sm font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400"
            >
              <option value="default">Recently Added</option>
              <option value="expiryDate">Expiry Date (Soonest First)</option>
              <option value="addedDate">Added Date (Newest First)</option>
              <option value="alphabetical">Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Expiration Alert Banner */}
        {(() => {
          const expiringSoonItems = items.filter((item) => {
            if (!item.expirationDate) return false;
            const expirationTime = new Date(item.expirationDate).getTime();
            const now = Date.now();
            const daysUntilExpiry = (expirationTime - now) / (1000 * 60 * 60 * 24);
            return daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
          });

          return (
            expiringSoonItems.length > 0 && (
              <div className="bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500 p-4 mb-6 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">⚠️</span>
                  <h3 className="font-semibold text-orange-900 dark:text-orange-300">
                    {expiringSoonItems.length} item{expiringSoonItems.length !== 1 ? "s" : ""} expiring soon
                  </h3>
                </div>
                <ul className="text-sm space-y-1">
                  {expiringSoonItems.map((item) => (
                    <li key={item.id} className="text-orange-800 dark:text-orange-400">
                      {item.name} - expires{" "}
                      {new Date(item.expirationDate!).toLocaleDateString()}
                    </li>
                  ))}
                </ul>
              </div>
            )
          );
        })()}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl mb-4">
            Failed to load items. Please try again.
          </div>
        )}

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 dark:border-gray-700 border-t-emerald-500"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">
              Loading inventory...
            </p>
          </div>
        ) : filteredItems.length === 0 && items.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Your kitchen is empty
            </p>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
              Start scanning items to track your inventory
            </p>
            <Link
              href="/scan"
              className="inline-block bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all active:scale-95"
            >
              Scan Your First Item
            </Link>
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="text-6xl mb-4">
              {filter === "fridge" ? "🧊" : filter === "freezer" ? "❄️" : "🥫"}
            </div>
            <p className="text-lg font-medium text-gray-600 dark:text-gray-400">
              No items in {filter === "fridge" ? "fridge" : filter === "freezer" ? "freezer" : "pantry"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium px-1">
              {sortedItems.length}{" "}
              {sortedItems.length === 1 ? "item" : "items"}
              {filter !== "all" &&
                ` in ${filter === "fridge" ? "fridge" : filter === "freezer" ? "freezer" : "pantry"}`}
              {tagFilter && ` with tag "${tagFilter}"`}
            </p>
            {viewMode === "card" ? (
              <>
                {sortedItems.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onDelete={handleDelete}
                    onUpdateQuantity={handleUpdateQuantity}
                    onSplit={handleSplit}
                    onEdit={handleEdit}
                  />
                ))}
              </>
            ) : (
              <>
                {sortedItems.map((item) => (
                  <ItemListView
                    key={item.id}
                    item={item}
                    onDelete={handleDelete}
                    onUpdateQuantity={handleUpdateQuantity}
                    onEdit={handleEdit}
                  />
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Split Item Modal */}
      {itemToSplit && (
        <SplitItemModal
          item={itemToSplit}
          isOpen={splitModalOpen}
          onClose={() => {
            setSplitModalOpen(false);
            setItemToSplit(null);
          }}
          onConfirm={handleSplitConfirm}
        />
      )}

      {/* Edit Item Modal */}
      {itemToEdit && (
        <EditItemModal
          item={itemToEdit}
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setItemToEdit(null);
          }}
          onSave={handleEditSave}
        />
      )}
    </main>
  );
}
