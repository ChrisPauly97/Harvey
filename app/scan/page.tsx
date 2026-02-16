"use client";

import BluetoothBarcodeScanner from "@/components/BluetoothBarcodeScanner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ScanPage() {
  const router = useRouter();
  const [manualBarcode, setManualBarcode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<"fridge" | "freezer" | "pantry">("fridge");
  const [expirationDate, setExpirationDate] = useState("");

  const addItem = async (barcode: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          barcode,
          category,
          expirationDate: expirationDate || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add item");
      }

      router.push("/");
    } catch (err) {
      console.error("Error adding item:", err);
      setError("Failed to add item. Please try again.");
      setLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualBarcode.trim()) {
      addItem(manualBarcode.trim());
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
              Add Item
            </h1>
            <div className="w-16"></div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 dark:border-gray-700 border-t-emerald-500"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">
              Adding item...
            </p>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl mb-4">
                {error}
              </div>
            )}

            {/* Category Selector */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-4">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                Where are you storing this?
              </h2>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setCategory("fridge")}
                  className={`py-4 px-4 rounded-xl font-semibold transition-all ${
                    category === "fridge"
                      ? "bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-md"
                      : "bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <div className="text-3xl mb-1">🧊</div>
                  <div className="text-sm">Fridge</div>
                </button>
                <button
                  onClick={() => setCategory("freezer")}
                  className={`py-4 px-4 rounded-xl font-semibold transition-all ${
                    category === "freezer"
                      ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md"
                      : "bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <div className="text-3xl mb-1">❄️</div>
                  <div className="text-sm">Freezer</div>
                </button>
                <button
                  onClick={() => setCategory("pantry")}
                  className={`py-4 px-4 rounded-xl font-semibold transition-all ${
                    category === "pantry"
                      ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md"
                      : "bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <div className="text-3xl mb-1">🥫</div>
                  <div className="text-sm">Pantry</div>
                </button>
              </div>
            </div>

            {/* Expiration Date Input */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-4">
              <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                📅 Expiration Date (Optional)
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Leave blank if the item doesn&apos;t expire
              </p>
              <input
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            {/* Bluetooth Scanner */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-4">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                📡 Bluetooth Scanner
              </h2>
              <BluetoothBarcodeScanner onScan={addItem} />
            </div>

            {/* Manual Entry */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                ⌨️ Manual Entry
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Can&apos;t scan? Enter the barcode manually
              </p>
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  placeholder="Enter barcode number"
                  className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={!manualBarcode.trim()}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-sm active:scale-95"
                >
                  Add
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
