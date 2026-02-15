"use client";

import ItemCard from "@/components/ItemCard";
import { Item } from "@/lib/schema";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "fridge" | "pantry">("all");

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

      if (!response.ok) throw new Error("Failed to delete item");

      setItems(items.filter((item) => item.id !== id));
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

  const filteredItems =
    filter === "all" ? items : items.filter((item) => item.category === filter);

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
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
            <Link
              href="/scan"
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-2"
            >
              <span className="text-lg">+</span> Add Item
            </Link>
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
                : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
            }`}
          >
            All <span className="opacity-70">({items.length})</span>
          </button>
          <button
            onClick={() => setFilter("fridge")}
            className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all flex-shrink-0 ${
              filter === "fridge"
                ? "bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
            }`}
          >
            🧊 Fridge{" "}
            <span className="opacity-70">
              ({items.filter((i) => i.category === "fridge").length})
            </span>
          </button>
          <button
            onClick={() => setFilter("pantry")}
            className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all flex-shrink-0 ${
              filter === "pantry"
                ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
            }`}
          >
            🥫 Pantry{" "}
            <span className="opacity-70">
              ({items.filter((i) => i.category === "pantry").length})
            </span>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-emerald-500"></div>
            <p className="mt-4 text-gray-600 font-medium">
              Loading inventory...
            </p>
          </div>
        ) : filteredItems.length === 0 && items.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-xl font-semibold text-gray-900 mb-2">
              Your kitchen is empty
            </p>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
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
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="text-6xl mb-4">
              {filter === "fridge" ? "🧊" : "🥫"}
            </div>
            <p className="text-lg font-medium text-gray-600">
              No items in {filter === "fridge" ? "fridge" : "pantry"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 font-medium px-1">
              {filteredItems.length}{" "}
              {filteredItems.length === 1 ? "item" : "items"}
              {filter !== "all" &&
                ` in ${filter === "fridge" ? "fridge" : "pantry"}`}
            </p>
            {filteredItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onDelete={handleDelete}
                onUpdateQuantity={handleUpdateQuantity}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
