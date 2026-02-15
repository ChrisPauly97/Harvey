import { db } from "@/lib/db";
import { itemEvents } from "@/lib/schema";

export type EventType =
  | "added"
  | "quantity_increment"
  | "quantity_decrement"
  | "deleted"
  | "usage_updated";

export interface LogEventParams {
  itemId?: number;
  barcode: string;
  name: string;
  category: "fridge" | "freezer" | "pantry";
  eventType: EventType;
  quantityChange?: number;
  usageLevelBefore?: number;
  usageLevelAfter?: number;
  metadata?: Record<string, any>;
}

/**
 * Log an item event for trend analysis
 * All parameters are stored, allowing analysis even after item deletion
 */
export async function logItemEvent(params: LogEventParams): Promise<void> {
  try {
    await db.insert(itemEvents).values({
      itemId: params.itemId,
      barcode: params.barcode,
      name: params.name,
      category: params.category,
      eventType: params.eventType,
      quantityChange: params.quantityChange,
      usageLevelBefore: params.usageLevelBefore,
      usageLevelAfter: params.usageLevelAfter,
      metadata: params.metadata || {},
    });
  } catch (error) {
    console.error("Failed to log item event:", error);
    // Don't throw - event logging shouldn't break the main operation
  }
}
