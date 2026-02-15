"use client";

import { Item } from "@/lib/schema";
import Image from "next/image";

interface ItemCardProps {
  item: Item;
  onDelete: (id: number) => void;
  onUpdateQuantity: (id: number, action: "increment" | "decrement") => void;
}

export default function ItemCard({
  item,
  onDelete,
  onUpdateQuantity,
}: ItemCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 flex items-center gap-4">
      {item.imageUrl && (
        <div className="relative w-16 h-16 flex-shrink-0">
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            className="object-cover rounded"
            sizes="64px"
          />
        </div>
      )}
      <div className="flex-grow min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-lg truncate">{item.name}</h3>
          <span
            className={`px-2 py-1 rounded text-xs font-semibold ${
              item.category === "fridge"
                ? "bg-blue-100 text-blue-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {item.category === "fridge" ? "🧊 Fridge" : "🥫 Pantry"}
          </span>
        </div>
        <p className="text-sm text-gray-500">{item.barcode}</p>
        <p className="text-xs text-gray-400">
          Added {new Date(item.addedAt).toLocaleDateString()}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
          <button
            onClick={() => onUpdateQuantity(item.id, "decrement")}
            className="text-red-500 hover:text-red-600 font-bold text-xl w-8 h-8 flex items-center justify-center"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="font-semibold text-lg min-w-[2rem] text-center">
            {item.quantity}
          </span>
          <button
            onClick={() => onUpdateQuantity(item.id, "increment")}
            className="text-green-500 hover:text-green-600 font-bold text-xl w-8 h-8 flex items-center justify-center"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
        <button
          onClick={() => onDelete(item.id)}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Remove All
        </button>
      </div>
    </div>
  );
}
