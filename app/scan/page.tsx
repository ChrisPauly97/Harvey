"use client";

import KeyboardBarcodeScanner from "@/components/KeyboardBarcodeScanner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface ScannedItem {
  barcode: string;
  name?: string;
  timestamp: number;
}

export default function ScanPage() {
  const router = useRouter();
  const [manualBarcode, setManualBarcode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [category, setCategory] = useState<"fridge" | "freezer" | "pantry">("fridge");
  const [expirationDate, setExpirationDate] = useState("");
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);

  // Auto-hide success message after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const addItem = async (barcode: string) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

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

      const data = await response.json();

      // Add to scanned items list for continuous scanning
      setScannedItems((prev) => [
        { barcode, name: data.name, timestamp: Date.now() },
        ...prev,
      ]);

      setSuccess(`✅ Added: ${data.name || barcode}`);
      setLoading(false);
    } catch (err) {
      console.error("Error adding item:", err);
      setError("Failed to add item. Please try again.");
      setLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Prevent page reload
    e.stopPropagation(); // Stop event bubbling
    if (manualBarcode.trim()) {
      addItem(manualBarcode.trim());
      setManualBarcode("");
    }
  };

  // Prevent any accidental form submissions from causing page reload
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

      <div className="max-w-3xl mx-auto px-4 py-6 pb-20">
        {/* Success Toast */}
        {success && (
          <div className="fixed top-20 left-4 right-4 max-w-sm mx-auto bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-xl shadow-lg animate-pulse z-50">
            {success}
          </div>
        )}

        {/* Continuous Scanning Active Banner */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-3 rounded-xl mb-4 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🔄</span>
              <div>
                <p className="font-semibold">Continuous Scanning Active</p>
                <p className="text-xs opacity-90">Just scan items - no clicking needed!</p>
              </div>
            </div>
            {scannedItems.length > 0 && (
              <div className="bg-white/20 px-3 py-1 rounded-full">
                <p className="font-bold">{scannedItems.length}</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
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

            {/* Keyboard Scanner */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-4">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                📡 Scanner
              </h2>
              <KeyboardBarcodeScanner onScan={addItem} />
            </div>

            {/* Manual Entry */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-4">
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

            {/* Recently Scanned Items */}
            {scannedItems.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-4">
                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                  📋 Recently Scanned
                </h2>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {scannedItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {item.name || item.barcode}
                        </p>
                        {item.name && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {item.barcode}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Finish Button */}
            {scannedItems.length > 0 && (
              <button
                onClick={() => router.push("/")}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-4 rounded-xl font-semibold transition-all shadow-md active:scale-95"
              >
                ✅ Done - View Inventory
              </button>
            )}
          </>
        )}
      </div>
    </main>
  );
}
