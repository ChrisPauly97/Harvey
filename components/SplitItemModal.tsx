"use client";

import { Item } from "@/lib/schema";
import { useState } from "react";

interface SplitItemModalProps {
  item: Item;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: SplitData) => Promise<void>;
}

export interface SplitData {
  numPortions: number;
  portionSize?: string;
  portionAmount?: number;
  portionUnit?: string;
  expirationDate?: string;
}

export default function SplitItemModal({
  item,
  isOpen,
  onClose,
  onConfirm,
}: SplitItemModalProps) {
  const [numPortions, setNumPortions] = useState(2);
  const [portionSize, setPortionSize] = useState("");
  const [portionAmount, setPortionAmount] = useState<number | undefined>(undefined);
  const [portionUnit, setPortionUnit] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setLoading(true);
      setError("");

      await onConfirm({
        numPortions,
        portionSize: portionSize || undefined,
        portionAmount: portionAmount || undefined,
        portionUnit: portionUnit || undefined,
        expirationDate: expirationDate || undefined,
      });

      // Reset form
      setNumPortions(2);
      setPortionSize("");
      setPortionAmount(undefined);
      setPortionUnit("");
      setExpirationDate("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to split item");
    } finally {
      setLoading(false);
    }
  };

  const remaining = item.quantity - numPortions;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Split Item Into Portions
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {item.name}
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Number of Portions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Number of Portions
            </label>
            <div className="space-y-3">
              <input
                type="number"
                min={2}
                max={item.quantity}
                value={numPortions}
                onChange={(e) => setNumPortions(parseInt(e.target.value) || 2)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <input
                type="range"
                min={2}
                max={item.quantity}
                value={numPortions}
                onChange={(e) => setNumPortions(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
            <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                📦 Create <span className="font-bold">{numPortions}</span> portions,{" "}
                <span className="font-bold">{remaining}</span> remaining
              </p>
            </div>
          </div>

          {/* Portion Size (Display String) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Portion Size (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g., 250g, 1 cup, 4 oz"
              value={portionSize}
              onChange={(e) => setPortionSize(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {/* Portion Amount & Unit (For Sorting) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Amount (Optional)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="250"
                value={portionAmount || ""}
                onChange={(e) => setPortionAmount(parseFloat(e.target.value) || undefined)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Unit (Optional)
              </label>
              <input
                type="text"
                placeholder="g, ml, oz"
                value={portionUnit}
                onChange={(e) => setPortionUnit(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Expiration Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Expiration Date (Optional)
            </label>
            <input
              type="date"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              All portions will have the same expiration date
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || numPortions < 2 || numPortions > item.quantity}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-teal-700 active:from-emerald-700 active:to-teal-800 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Splitting..." : "Confirm Split"}
          </button>
        </div>
      </div>
    </div>
  );
}
