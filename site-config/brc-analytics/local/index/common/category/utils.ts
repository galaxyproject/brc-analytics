import { getPriorityLabel } from "@/viewModelBuilders/catalog/brc-analytics-catalog/common/priority";
import { isOutbreakPriority } from "./typeGuards";

/**
 * Returns the priority label for the given value.
 * @param value - Value.
 * @returns Priority label.
 */
export function mapPriority(value: string): string {
  if (isOutbreakPriority(value)) return getPriorityLabel(value);
  return "Unprioritized";
}

/**
 * Returns the priority pathogen name for the given value.
 * @param value - Value.
 * @returns Priority pathogen name.
 */
export function mapPriorityPathogenName(value: string): string {
  if (!value) return "Unprioritized";
  return value;
}
