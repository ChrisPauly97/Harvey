"use client";

import { useState, useEffect } from "react";
import { Equipment } from "@/lib/schema";

interface EquipmentModalProps {
  isOpen: boolean;
  equipmentToEdit?: Equipment | null;
  defaultType?: string;
  onClose: () => void;
  onSave: (eq: Equipment) => void;
}

const EQUIPMENT_TYPES = [
  { value: "grinder", label: "Grinder" },
  { value: "espresso_machine", label: "Espresso Machine" },
  { value: "pour_over", label: "Pour-Over Device" },
  { value: "other", label: "Other" },
];

export default function EquipmentModal({
  isOpen,
  equipmentToEdit,
  defaultType,
  onClose,
  onSave,
}: EquipmentModalProps) {
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [type, setType] = useState(defaultType ?? "grinder");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (equipmentToEdit) {
      setName(equipmentToEdit.name);
      setBrand(equipmentToEdit.brand ?? "");
      setType(equipmentToEdit.type);
      setNotes(equipmentToEdit.notes ?? "");
    } else {
      setName("");
      setBrand("");
      setType(defaultType ?? "grinder");
      setNotes("");
    }
    setError("");
  }, [equipmentToEdit, isOpen, defaultType]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (!type) {
      setError("Type is required");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        name: name.trim(),
        brand: brand.trim() || null,
        type,
        notes: notes.trim() || null,
      };

      const url = equipmentToEdit ? `/api/equipment/${equipmentToEdit.id}` : "/api/equipment";
      const method = equipmentToEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to save equipment");
        return;
      }

      const saved = await res.json();
      onSave(saved);
      onClose();
    } catch {
      setError("Failed to save equipment");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-stone-600 to-stone-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-white font-bold text-lg">
            {equipmentToEdit ? "Edit Equipment" : "Add Equipment"}
          </h2>
          <button onClick={onClose} className="text-white/80 hover:text-white text-2xl leading-none">
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Type <span className="text-red-500">*</span>
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-stone-500 focus:border-transparent outline-none"
            >
              {EQUIPMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Niche Zero, La Marzocco Linea Mini"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-stone-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Brand
            </label>
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g. Niche, La Marzocco, Hario"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-stone-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes about this equipment..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-stone-500 focus:border-transparent outline-none resize-none"
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
            className="flex-1 py-2 rounded-lg bg-gradient-to-r from-stone-600 to-stone-700 text-white font-medium hover:from-stone-700 hover:to-stone-800 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving..." : equipmentToEdit ? "Save Changes" : "Add Equipment"}
          </button>
        </div>
      </div>
    </div>
  );
}
