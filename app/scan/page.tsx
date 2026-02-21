"use client";

import KeyboardBarcodeScanner from "@/components/KeyboardBarcodeScanner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface ScannedItem {
  id: number;
  barcode: string;
  name: string;
  category: "fridge" | "freezer" | "pantry";
  timestamp: number;
}

export default function ScanPage() {
  const router = useRouter();
  const [scanning, setScanning] = useState(true);
  const [manualBarcode, setManualBarcode] = useState("");
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addItem = async (barcode: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ barcode }),  // NO category - let server infer
      });

      if (!response.ok) {
        throw new Error("Failed to add item");
      }

      const newItem = await response.json();

      // Add to scanned items with the server-inferred category
      setScannedItems((prev) => [
        {
          id: newItem.id,
          barcode: newItem.barcode,
          name: newItem.name,
          category: newItem.category,
          timestamp: Date.now(),
        },
        ...prev,
      ]);

      // Signal home page to update cache
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "newItemAdded",
          JSON.stringify({
            item: newItem,
            timestamp: Date.now(),
          })
        );
      }

      setLoading(false);
    } catch (err) {
      console.error("Error adding item:", err);
      setError("Failed to add item. Please try again.");
      setLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (manualBarcode.trim()) {
      addItem(manualBarcode.trim());
      setManualBarcode("");
    }
  };

  const handleCategoryChange = async (
    itemId: number,
    newCategory: "fridge" | "freezer" | "pantry"
  ) => {
    // Optimistic update
    setScannedItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, category: newCategory } : item
      )
    );

    // Update in database
    try {
      await fetch(`/api/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: newCategory }),
      });
    } catch (err) {
      console.error("Error updating category:", err);
      // Revert on error
      setScannedItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? { ...item, category: item.category }
            : item
        )
      );
    }
  };

  // Warn before leaving with unsubmitted items
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (scannedItems.length > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [scannedItems.length]);

  const getCategoryStyles = (category: "fridge" | "freezer" | "pantry") => {
    switch (category) {
      case "fridge":
        return "from-blue-500 to-cyan-600";
      case "freezer":
        return "from-purple-500 to-indigo-600";
      case "pantry":
        return "from-amber-500 to-orange-600";
    }
  };

  const getCategoryEmoji = (category: "fridge" | "freezer" | "pantry") => {
    switch (category) {
      case "fridge":
        return "🧊";
      case "freezer":
        return "❄️";
      case "pantry":
        return "🥫";
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 font-semibold transition-colors"
            >
              <span className="text-xl">←</span> Back
            </Link>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Add Items
            </h1>
            {scannedItems.length > 0 && (
              <button
                onClick={() => router.push("/")}
                className="text-emerald-600 dark:text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 font-semibold transition-colors"
              >
                Done
              </button>
            )}
            {scannedItems.length === 0 && <div className="w-12"></div>}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 pb-20">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        {/* Manual Entry (always visible at top) */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={manualBarcode}
            onChange={(e) => setManualBarcode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleManualSubmit(e as any);
              }
            }}
            placeholder="Enter barcode or scan..."
            className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
          <button
            onClick={(e) => handleManualSubmit(e as any)}
            disabled={!manualBarcode.trim()}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-sm active:scale-95"
          >
            Add
          </button>
        </div>

        {/* Scanning Toggle */}
        <button
          onClick={() => setScanning(!scanning)}
          className={`w-full px-4 py-3 rounded-xl font-semibold transition-all mb-6 ${
            scanning
              ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
              : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100"
          }`}
        >
          {scanning ? "🔄 Scanning Active" : "⏸ Scanning Paused"}
        </button>

        {/* Hidden scanner - controlled by scanning state */}
        <KeyboardBarcodeScanner onScan={addItem} isActive={scanning} />

        {/* Loading state */}
        {loading && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-200 dark:border-gray-700 border-t-emerald-500"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">
              Adding item...
            </p>
          </div>
        )}

        {/* Recently Scanned Items */}
        {scannedItems.length > 0 && !loading && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide px-2">
              Recently Scanned
            </h2>
            {scannedItems.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {item.barcode}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {(["fridge", "freezer", "pantry"] as const).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => handleCategoryChange(item.id, cat)}
                        className={`px-3 py-2 rounded-lg font-semibold transition-all text-sm whitespace-nowrap ${
                          item.category === cat
                            ? `bg-gradient-to-r ${getCategoryStyles(cat)} text-white shadow-md`
                            : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                        }`}
                      >
                        {getCategoryEmoji(cat)} {cat === "fridge" ? "Fridge" : cat === "freezer" ? "Freeze" : "Pantry"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && scannedItems.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p className="text-lg font-medium">Ready to scan</p>
            <p className="text-sm mt-2">
              {scanning
                ? "Scan items with your scanner or enter barcode manually"
                : "Scanning is paused. Click the button above to resume."}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
