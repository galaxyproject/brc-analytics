import { formatNumber } from "@repo/shared/viewModelBuilders/viewModelBuilders";
import { type CellContext } from "@tanstack/react-table";
import { type Organism } from "./types";

/**
 * Renders a number with commas as thousands separators.
 * @param cellContext - Cell context.
 * @returns A number with commas as thousands separators.
 */
export function renderNumber(
  cellContext: CellContext<Organism, unknown>
): string {
  return formatNumber(cellContext.getValue());
}
