"use client";

import { useState, useEffect, useCallback } from "react";
import CoffeeCard from "@/components/CoffeeCard";
import BrewCard from "@/components/BrewCard";
import AddCoffeeModal from "@/components/AddCoffeeModal";
import LogBrewModal from "@/components/LogBrewModal";
import EquipmentModal from "@/components/EquipmentModal";
import { Coffee, CoffeeWithBrewCount, BrewWithRelations, Equipment } from "@/lib/schema";

type ActiveTab = "coffees" | "brews" | "equipment";

const BREW_METHOD_LABELS: Record<string, string> = {
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

const EQUIPMENT_TYPE_LABELS: Record<string, string> = {
  grinder: "Grinders",
  espresso_machine: "Espresso Machines",
  pour_over: "Pour-Over Devices",
  other: "Other Equipment",
};

const EQUIPMENT_TYPE_ORDER = ["grinder", "espresso_machine", "pour_over", "other"];

export default function CoffeePage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("coffees");
  const [coffees, setCoffees] = useState<CoffeeWithBrewCount[]>([]);
  const [brews, setBrews] = useState<BrewWithRelations[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [addCoffeeOpen, setAddCoffeeOpen] = useState(false);
  const [coffeeToEdit, setCoffeeToEdit] = useState<CoffeeWithBrewCount | null>(null);
  const [logBrewOpen, setLogBrewOpen] = useState(false);
  const [defaultCoffeeId, setDefaultCoffeeId] = useState<number | null>(null);
  const [addEquipmentOpen, setAddEquipmentOpen] = useState(false);
  const [equipmentToEdit, setEquipmentToEdit] = useState<Equipment | null>(null);

  // Filter state
  const [brewMethodFilter, setBrewMethodFilter] = useState("");
  const [coffeeFilter, setCoffeeFilter] = useState<number | null>(null);
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  const fetchCoffees = useCallback(async () => {
    try {
      const res = await fetch("/api/coffee");
      if (res.ok) {
        const data = await res.json();
        setCoffees(data);
      }
    } catch (error) {
      console.error("Failed to fetch coffees:", error);
    }
  }, []);

  const fetchBrews = useCallback(async () => {
    try {
      const res = await fetch("/api/brews");
      if (res.ok) {
        const data = await res.json();
        setBrews(data);
      }
    } catch (error) {
      console.error("Failed to fetch brews:", error);
    }
  }, []);

  const fetchEquipment = useCallback(async () => {
    try {
      const res = await fetch("/api/equipment");
      if (res.ok) {
        const data = await res.json();
        setEquipment(data);
      }
    } catch (error) {
      console.error("Failed to fetch equipment:", error);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchCoffees(), fetchBrews(), fetchEquipment()]).finally(() =>
      setLoading(false)
    );
  }, [fetchCoffees, fetchBrews, fetchEquipment]);

  // Filtered data
  const filteredCoffees = showActiveOnly ? coffees.filter((c) => c.isActive) : coffees;
  const filteredBrews = brews.filter((b) => {
    if (brewMethodFilter && b.brewMethod !== brewMethodFilter) return false;
    if (coffeeFilter !== null && b.coffeeId !== coffeeFilter) return false;
    return true;
  });

  // Unique brew methods from loaded brews
  const brewMethodsInUse = Array.from(new Set(brews.map((b) => b.brewMethod)));

  // Equipment grouped by type
  const equipmentByType = EQUIPMENT_TYPE_ORDER.reduce<Record<string, Equipment[]>>((acc, type) => {
    const items = equipment.filter((e) => e.type === type);
    if (items.length > 0) acc[type] = items;
    return acc;
  }, {});

  async function handleDeleteCoffee(id: number) {
    if (!confirm("Delete this coffee? Associated brews will remain but lose the coffee link.")) return;
    try {
      await fetch(`/api/coffee/${id}`, { method: "DELETE" });
      setCoffees((prev) => prev.filter((c) => c.id !== id));
    } catch (error) {
      console.error("Failed to delete coffee:", error);
    }
  }

  async function handleToggleActive(id: number, isActive: boolean) {
    try {
      const res = await fetch(`/api/coffee/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (res.ok) {
        const updated = await res.json();
        setCoffees((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));
      }
    } catch (error) {
      console.error("Failed to toggle active:", error);
    }
  }

  function handleCoffeeSaved(saved: Coffee) {
    setCoffees((prev) => {
      const exists = prev.find((c) => c.id === saved.id);
      if (exists) {
        return prev.map((c) => (c.id === saved.id ? { ...c, ...saved } : c));
      }
      return [{ ...saved, brewCount: 0 }, ...prev];
    });
  }

  function handleBrewSaved() {
    fetchBrews();
    fetchCoffees(); // refresh brew counts
  }

  async function handleDeleteBrew(id: number) {
    try {
      await fetch(`/api/brews/${id}`, { method: "DELETE" });
      setBrews((prev) => prev.filter((b) => b.id !== id));
      fetchCoffees(); // refresh brew counts
    } catch (error) {
      console.error("Failed to delete brew:", error);
    }
  }

  function handleLogBrewForCoffee(coffeeId: number) {
    setDefaultCoffeeId(coffeeId);
    setLogBrewOpen(true);
  }

  async function handleDeleteEquipment(id: number) {
    if (!confirm("Delete this equipment? Associated brews will lose the equipment link.")) return;
    try {
      await fetch(`/api/equipment/${id}`, { method: "DELETE" });
      setEquipment((prev) => prev.filter((e) => e.id !== id));
    } catch (error) {
      console.error("Failed to delete equipment:", error);
    }
  }

  async function handleToggleEquipmentActive(id: number, isActive: boolean) {
    try {
      const res = await fetch(`/api/equipment/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (res.ok) {
        const updated = await res.json();
        setEquipment((prev) => prev.map((e) => (e.id === id ? updated : e)));
      }
    } catch (error) {
      console.error("Failed to toggle equipment active:", error);
    }
  }

  function handleEquipmentSaved(saved: Equipment) {
    setEquipment((prev) => {
      const exists = prev.find((e) => e.id === saved.id);
      if (exists) return prev.map((e) => (e.id === saved.id ? saved : e));
      return [saved, ...prev];
    });
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 pb-24">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">☕ Coffee</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {coffees.length} coffee{coffees.length !== 1 ? "s" : ""} · {brews.length} brew{brews.length !== 1 ? "s" : ""}
              </p>
            </div>
            {activeTab === "coffees" && (
              <button
                onClick={() => { setCoffeeToEdit(null); setAddCoffeeOpen(true); }}
                className="py-2 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium text-sm hover:from-amber-600 hover:to-orange-600 transition-colors shadow-sm"
              >
                + Add Coffee
              </button>
            )}
            {activeTab === "brews" && (
              <button
                onClick={() => { setDefaultCoffeeId(null); setLogBrewOpen(true); }}
                className="py-2 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium text-sm hover:from-amber-600 hover:to-orange-600 transition-colors shadow-sm"
              >
                + Log Brew
              </button>
            )}
            {activeTab === "equipment" && (
              <button
                onClick={() => { setEquipmentToEdit(null); setAddEquipmentOpen(true); }}
                className="py-2 px-4 rounded-xl bg-gradient-to-r from-stone-600 to-stone-700 text-white font-medium text-sm hover:from-stone-700 hover:to-stone-800 transition-colors shadow-sm"
              >
                + Add Equipment
              </button>
            )}
          </div>

          {/* Tab switcher */}
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            {(["coffees", "brews", "equipment"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? "bg-white dark:bg-gray-700 text-amber-600 dark:text-amber-400 shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Brews tab filters */}
          {activeTab === "brews" && (
            <div className="mt-3 flex flex-wrap gap-2">
              <select
                value={brewMethodFilter}
                onChange={(e) => setBrewMethodFilter(e.target.value)}
                className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-amber-500 outline-none"
              >
                <option value="">All methods</option>
                {brewMethodsInUse.map((m) => (
                  <option key={m} value={m}>{BREW_METHOD_LABELS[m] ?? m}</option>
                ))}
              </select>
              {coffeeFilter !== null && (
                <button
                  onClick={() => setCoffeeFilter(null)}
                  className="text-sm px-3 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1"
                >
                  {coffees.find((c) => c.id === coffeeFilter)?.name ?? "Coffee"} ×
                </button>
              )}
            </div>
          )}

          {/* Coffees tab filter */}
          {activeTab === "coffees" && coffees.length > 0 && (
            <div className="mt-3">
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showActiveOnly}
                  onChange={(e) => setShowActiveOnly(e.target.checked)}
                  className="rounded accent-amber-500"
                />
                Active only
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400 dark:text-gray-500">
            Loading...
          </div>
        ) : (
          <>
            {/* Coffees tab */}
            {activeTab === "coffees" && (
              <>
                {filteredCoffees.length === 0 ? (
                  <div className="text-center py-20">
                    <p className="text-5xl mb-4">☕</p>
                    <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">No coffees yet</p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Add your first coffee to get started</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCoffees.map((coffee) => (
                      <CoffeeCard
                        key={coffee.id}
                        coffee={coffee}
                        onEdit={(c) => { setCoffeeToEdit(c); setAddCoffeeOpen(true); }}
                        onDelete={handleDeleteCoffee}
                        onToggleActive={handleToggleActive}
                        onLogBrew={handleLogBrewForCoffee}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Brews tab */}
            {activeTab === "brews" && (
              <>
                {filteredBrews.length === 0 ? (
                  <div className="text-center py-20">
                    <p className="text-5xl mb-4">🫖</p>
                    <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                      {brews.length === 0 ? "No brews logged yet" : "No brews match your filters"}
                    </p>
                    {brews.length === 0 && (
                      <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Log your first brew to start tracking</p>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {filteredBrews.map((brew) => (
                      <BrewCard key={brew.id} brew={brew} onDelete={handleDeleteBrew} />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Equipment tab */}
            {activeTab === "equipment" && (
              <>
                {equipment.length === 0 ? (
                  <div className="text-center py-20">
                    <p className="text-5xl mb-4">⚙️</p>
                    <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">No equipment added yet</p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Add your grinders and brewing devices</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    {Object.entries(equipmentByType).map(([type, items]) => (
                      <div key={type}>
                        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                          {EQUIPMENT_TYPE_LABELS[type]}
                        </h2>
                        <div className="flex flex-col gap-2">
                          {items.map((item) => (
                            <div
                              key={item.id}
                              className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between gap-4 ${
                                !item.isActive ? "opacity-60" : ""
                              }`}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium text-gray-900 dark:text-white">{item.name}</span>
                                  {item.brand && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{item.brand}</span>
                                  )}
                                  {!item.isActive && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                                      Inactive
                                    </span>
                                  )}
                                </div>
                                {item.notes && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{item.notes}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={() => handleToggleEquipmentActive(item.id, !item.isActive)}
                                  className="text-xs px-2.5 py-1 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                  {item.isActive ? "Retire" : "Reactivate"}
                                </button>
                                <button
                                  onClick={() => { setEquipmentToEdit(item); setAddEquipmentOpen(true); }}
                                  className="text-xs px-2.5 py-1 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteEquipment(item.id)}
                                  className="text-xs px-2.5 py-1 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <AddCoffeeModal
        isOpen={addCoffeeOpen}
        coffeeToEdit={coffeeToEdit}
        onClose={() => { setAddCoffeeOpen(false); setCoffeeToEdit(null); }}
        onSave={handleCoffeeSaved}
      />

      <LogBrewModal
        isOpen={logBrewOpen}
        coffees={coffees}
        equipment={equipment}
        defaultCoffeeId={defaultCoffeeId}
        onClose={() => { setLogBrewOpen(false); setDefaultCoffeeId(null); }}
        onSave={handleBrewSaved}
      />

      <EquipmentModal
        isOpen={addEquipmentOpen}
        equipmentToEdit={equipmentToEdit}
        onClose={() => { setAddEquipmentOpen(false); setEquipmentToEdit(null); }}
        onSave={handleEquipmentSaved}
      />
    </main>
  );
}
