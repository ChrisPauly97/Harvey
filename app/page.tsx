"use client";

import ItemCard, { ItemWithChildren } from "@/components/ItemCard";
import SplitItemModal, { SplitData } from "@/components/SplitItemModal";
import ThemeToggle from "@/components/ThemeToggle";
import { Item } from "@/lib/schema";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [items, setItems] = useState<ItemWithChildren[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "fridge" | "freezer" | "pantry">("all");
  const [splitModalOpen, setSplitModalOpen] = useState(false);
  const [itemToSplit, setItemToSplit] = useState<Item | null>(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/items");
      if (!response.ok) throw new Error("Failed to fetch items");
      const data = await response.json();
      setItems(data);
      setError(null);
    } catch (err) {
      setError("Failed to load items. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleDelete = async (id: number) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    const confirmed = window.confirm(
      `Are you sure you want to remove all ${item.quantity} ${
        item.quantity === 1 ? "item" : "items"
      } of "${item.name}"?`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/items/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (response.status === 409 && result.error === "has_children") {
        // Parent has children - show cascade confirmation
        const cascadeConfirmed = window.confirm(
          `This item has ${result.count} split portion${
            result.count > 1 ? "s" : ""
          }. Delete all portions too?`
        );

        if (!cascadeConfirmed) return;

        // Cascade delete
        const cascadeRes = await fetch(`/api/items/${id}?cascade=true`, {
          method: "DELETE",
        });

        if (!cascadeRes.ok) throw new Error("Failed to delete");

        // Remove parent AND children from state
        setItems((prev) => prev.filter((i) => i.id !== id && i.parentId !== id));
      } else if (response.ok) {
        // Normal delete
        setItems(items.filter((item) => item.id !== id));
      } else {
        throw new Error("Failed to delete item");
      }
    } catch (err) {
      alert("Failed to delete item. Please try again.");
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

      const data = await response.json();

      if (data.deleted) {
        setItems(items.filter((item) => item.id !== id));
      } else {
        setItems(
          items.map((item) => (item.id === id ? { ...item, ...data } : item))
        );
      }
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

      // Update state: remove parent if deleted, otherwise update it, then add children
      setItems((prev) => {
        const filtered = result.deleted
          ? prev.filter((i) => i.id !== itemToSplit.id)
          : prev.map((i) =>
              i.id === itemToSplit.id ? { ...result.parent, childCount: 0 } : i
            );

        return [...filtered, ...result.children.map((c: Item) => ({ ...c, childCount: 0 }))];
      });

      setSplitModalOpen(false);
      setItemToSplit(null);
    } catch (error) {
      throw error; // Let modal handle the error display
    }
  };

  const filteredItems =
    filter === "all" ? items : items.filter((item) => item.category === filter);

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
        {/* Filter Buttons */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
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
            {error}
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
        ) : filteredItems.length === 0 ? (
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
              {filteredItems.length}{" "}
              {filteredItems.length === 1 ? "item" : "items"}
              {filter !== "all" &&
                ` in ${filter === "fridge" ? "fridge" : filter === "freezer" ? "freezer" : "pantry"}`}
            </p>
            {filteredItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onDelete={handleDelete}
                onUpdateQuantity={handleUpdateQuantity}
                onSplit={handleSplit}
              />
            ))}
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
    </main>
  );
}
