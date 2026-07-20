import { OUTBREAK_PRIORITY } from "@/apis/catalog/brc-analytics-catalog/common/schema-types";

/**
 * Checks if the value is an Outbreak Priority.
 * @param value - Value.
 * @returns True if the value is an Outbreak Priority, false otherwise.
 */
export function isOutbreakPriority(value: unknown): value is OUTBREAK_PRIORITY {
  if (!value) return false;
  if (typeof value !== "string") return false;
  return Object.values(OUTBREAK_PRIORITY).includes(value as OUTBREAK_PRIORITY);
}
