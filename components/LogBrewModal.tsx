"use client";

import { useState, useEffect } from "react";
import { Brew, Coffee, Equipment } from "@/lib/schema";

interface LogBrewModalProps {
  isOpen: boolean;
  coffees: Coffee[];
  equipment: Equipment[];
  defaultCoffeeId?: number | null;
  onClose: () => void;
  onSave: (brew: Brew) => void;
}

const BREW_METHODS = [
  { value: "pour_over", label: "Pour Over" },
  { value: "espresso", label: "Espresso" },
  { value: "aeropress", label: "AeroPress" },
  { value: "french_press", label: "French Press" },
  { value: "chemex", label: "Chemex" },
  { value: "v60", label: "V60" },
  { value: "kalita", label: "Kalita" },
  { value: "moka_pot", label: "Moka Pot" },
  { value: "cold_brew", label: "Cold Brew" },
  { value: "other", label: "Other" },
];

export default function LogBrewModal({
  isOpen,
  coffees,
  equipment,
  defaultCoffeeId,
  onClose,
  onSave,
}: LogBrewModalProps) {
  const [coffeeId, setCoffeeId] = useState<string>("");
  const [brewMethod, setBrewMethod] = useState("pour_over");
  const [brewingDeviceId, setBrewingDeviceId] = useState<string>("");
  const [grinderId, setGrinderId] = useState<string>("");
  const [grindSize, setGrindSize] = useState("");
  const [weightIn, setWeightIn] = useState("");
  const [weightOut, setWeightOut] = useState("");
  const [extractionTime, setExtractionTime] = useState("");
  const [waterTemperature, setWaterTemperature] = useState("");
  const [tastingNotes, setTastingNotes] = useState("");
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const grinders = equipment.filter((e) => e.type === "grinder" && e.isActive);
  const brewingDevices = equipment.filter((e) => e.type !== "grinder" && e.isActive);

  const ratio =
    weightIn && weightOut && parseFloat(weightIn) > 0
      ? (parseFloat(weightOut) / parseFloat(weightIn)).toFixed(1)
      : null;

  const extractionMmSs = extractionTime && parseInt(extractionTime) > 0
    ? `${Math.floor(parseInt(extractionTime) / 60)}:${(parseInt(extractionTime) % 60).toString().padStart(2, "0")}`
    : null;

  useEffect(() => {
    if (isOpen) {
      setCoffeeId(defaultCoffeeId ? String(defaultCoffeeId) : "");
      setBrewMethod("pour_over");
      setBrewingDeviceId("");
      setGrinderId("");
      setGrindSize("");
      setWeightIn("");
      setWeightOut("");
      setExtractionTime("");
      setWaterTemperature("");
      setTastingNotes("");
      setRating(0);
      setNotes("");
      setError("");
    }
  }, [isOpen, defaultCoffeeId]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!brewMethod) {
      setError("Brew method is required");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        coffeeId: coffeeId ? parseInt(coffeeId) : null,
        brewingDeviceId: brewingDeviceId ? parseInt(brewingDeviceId) : null,
        grinderId: grinderId ? parseInt(grinderId) : null,
        brewMethod,
        grindSize: grindSize.trim() || null,
        weightIn: weightIn ? parseFloat(weightIn) : null,
        weightOut: weightOut ? parseFloat(weightOut) : null,
        extractionTime: extractionTime ? parseInt(extractionTime) : null,
        waterTemperature: waterTemperature ? parseInt(waterTemperature) : null,
        tastingNotes: tastingNotes.trim() || null,
        rating: rating > 0 ? rating : null,
        notes: notes.trim() || null,
      };

      const res = await fetch("/api/brews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to log brew");
        return;
      }

      const saved = await res.json();
      onSave(saved);
      onClose();
    } catch {
      setError("Failed to log brew");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-stone-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-white font-bold text-lg">Log Brew</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white text-2xl leading-none">
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Coffee + method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Coffee
            </label>
            <select
              value={coffeeId}
              onChange={(e) => setCoffeeId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
            >
              <option value="">— No coffee selected —</option>
              {coffees.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.roaster ? ` (${c.roaster})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Brew Method <span className="text-red-500">*</span>
            </label>
            <select
              value={brewMethod}
              onChange={(e) => setBrewMethod(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
            >
              {BREW_METHODS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Equipment */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Brewing Device
              </label>
              <select
                value={brewingDeviceId}
                onChange={(e) => setBrewingDeviceId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
              >
                <option value="">— None —</option>
                {brewingDevices.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Grinder
              </label>
              <select
                value={grinderId}
                onChange={(e) => setGrinderId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
              >
                <option value="">— None —</option>
                {grinders.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Grind Size
            </label>
            <input
              type="text"
              value={grindSize}
              onChange={(e) => setGrindSize(e.target.value)}
              placeholder="e.g. 18 clicks, fine, 9.5"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Measurements */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Weight In (g)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={weightIn}
                onChange={(e) => setWeightIn(e.target.value)}
                placeholder="e.g. 18"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Weight Out (g)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={weightOut}
                onChange={(e) => setWeightOut(e.target.value)}
                placeholder="e.g. 36"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Live ratio display */}
          {ratio && (
            <p className="text-sm text-amber-600 dark:text-amber-400 font-medium -mt-2">
              Ratio: 1:{ratio}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Extraction Time (s)
              </label>
              <input
                type="number"
                min="0"
                value={extractionTime}
                onChange={(e) => setExtractionTime(e.target.value)}
                placeholder="e.g. 28"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
              />
              {extractionMmSs && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{extractionMmSs}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Water Temp (°C)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={waterTemperature}
                onChange={(e) => setWaterTemperature(e.target.value)}
                placeholder="e.g. 93"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Rating
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(rating === star ? 0 : star)}
                  className={`text-2xl transition-colors ${
                    star <= rating
                      ? "text-amber-400 hover:text-amber-500"
                      : "text-gray-300 dark:text-gray-600 hover:text-amber-300"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {/* Tasting notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tasting Notes
            </label>
            <textarea
              value={tastingNotes}
              onChange={(e) => setTastingNotes(e.target.value)}
              placeholder="e.g. chocolate, citrus, floral, caramel..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none resize-none"
            />
          </div>

          {/* General notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any other notes..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none resize-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-2 rounded-lg bg-gradient-to-r from-amber-600 to-stone-700 text-white font-medium hover:from-amber-700 hover:to-stone-800 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving..." : "Log Brew"}
          </button>
        </div>
      </div>
    </div>
  );
}
