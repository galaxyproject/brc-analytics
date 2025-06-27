import { isOutbreakPriority } from "./typeGuards";
import { getPriorityLabel } from "../../../../../../app/views/PriorityPathogensView/components/PriorityPathogens/utils";

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
