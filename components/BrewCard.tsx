"use client";

import { BrewWithRelations } from "@/lib/schema";

interface BrewCardProps {
  brew: BrewWithRelations;
  onDelete: (id: number) => void;
}

const brewMethodLabels: Record<string, string> = {
  pour_over: "Pour Over",
  espresso: "Espresso",
  aeropress: "AeroPress",
  french_press: "French Press",
  chemex: "Chemex",
  v60: "V60",
  kalita: "Kalita",
  moka_pot: "Moka Pot",
  cold_brew: "Cold Brew",
  other: "Other",
};

const brewMethodColors: Record<string, string> = {
  espresso: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  pour_over: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  aeropress: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  french_press: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  chemex: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  v60: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
  kalita: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  moka_pot: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  cold_brew: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  other: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
};

function formatSeconds(seconds: number | null): string | null {
  if (seconds === null || seconds === undefined) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}:${s.toString().padStart(2, "0")}` : `${s}s`;
}

function formatDate(ts: Date | null): string {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) +
    " " +
    d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export default function BrewCard({ brew, onDelete }: BrewCardProps) {
  const ratio =
    brew.weightIn && brew.weightOut
      ? (brew.weightOut / brew.weightIn).toFixed(1)
      : null;

  const extractionStr = formatSeconds(brew.extractionTime);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 flex flex-col gap-3">
      {/* Top row: method badge + date */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              brewMethodColors[brew.brewMethod] ?? brewMethodColors.other
            }`}
          >
            {brewMethodLabels[brew.brewMethod] ?? brew.brewMethod}
          </span>
          {brew.coffeeName && (
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
              {brew.coffeeName}
            </span>
          )}
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
          {formatDate(brew.brewedAt)}
        </span>
      </div>

      {/* Equipment row */}
      {(brew.brewingDeviceName || brew.grinderName) && (
        <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
          {brew.brewingDeviceName && (
            <span>🫖 {brew.brewingDeviceName}</span>
          )}
          {brew.grinderName && (
            <span>⚙️ {brew.grinderName}{brew.grindSize ? ` · ${brew.grindSize}` : ""}</span>
          )}
          {!brew.grinderName && brew.grindSize && (
            <span>⚙️ {brew.grindSize}</span>
          )}
        </div>
      )}

      {/* Stats row */}
      {(brew.weightIn || brew.weightOut || extractionStr || brew.waterTemperature) && (
        <div className="flex flex-wrap gap-3 text-sm">
          {(brew.weightIn || brew.weightOut) && (
            <span className="text-gray-700 dark:text-gray-300 font-mono">
              {brew.weightIn ? `${brew.weightIn}g` : "?"}
              {" → "}
              {brew.weightOut ? `${brew.weightOut}g` : "?"}
              {ratio && (
                <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">(1:{ratio})</span>
              )}
            </span>
          )}
          {extractionStr && (
            <span className="text-gray-600 dark:text-gray-400">⏱ {extractionStr}</span>
          )}
          {brew.waterTemperature && (
            <span className="text-gray-600 dark:text-gray-400">{brew.waterTemperature}°C</span>
          )}
        </div>
      )}

      {/* Rating */}
      {brew.rating && (
        <div className="text-base leading-none">
          {Array.from({ length: 5 }, (_, i) => (
            <span key={i} className={i < brew.rating! ? "text-amber-400" : "text-gray-300 dark:text-gray-600"}>
              ★
            </span>
          ))}
        </div>
      )}

      {/* Tasting notes */}
      {brew.tastingNotes && (
        <p className="text-sm italic text-gray-600 dark:text-gray-400 line-clamp-2">
          &ldquo;{brew.tastingNotes}&rdquo;
        </p>
      )}

      {/* General notes */}
      {brew.notes && (
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{brew.notes}</p>
      )}

      {/* Delete */}
      <div className="flex justify-end pt-1 border-t border-gray-100 dark:border-gray-700">
        <button
          onClick={() => onDelete(brew.id)}
          className="text-xs px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
