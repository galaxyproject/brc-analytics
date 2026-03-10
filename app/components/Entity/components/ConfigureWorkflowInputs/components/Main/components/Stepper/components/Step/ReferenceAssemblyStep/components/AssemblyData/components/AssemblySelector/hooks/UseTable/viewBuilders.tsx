import { ChipCell } from "@databiosphere/findable-ui/lib/components/Table/components/TableCell/components/ChipCell/chipCell";
import { CellContext } from "@tanstack/react-table";
import { JSX } from "react";
import {
  buildIsRef,
  formatNumber,
} from "../../../../../../../../../../../../../../../../../viewModelBuilders/catalog/brc-analytics-catalog/common/viewModelBuilders";
import { Assembly } from "./types";

/**
 * Renders Is Ref cell as "Yes" or "No" with a chip.
 * @param cellContext - Cell context.
 * @returns "Yes" or "No" with a chip.
 */
export function renderIsRef(
  cellContext: CellContext<Assembly, unknown>
): JSX.Element {
  return <ChipCell {...buildIsRef(cellContext.row.original)} />;
}

/**
 * Renders a number with commas as thousands separators.
 * @param cellContext - Cell context.
 * @returns A number with commas as thousands separators.
 */
export function renderNumber(
  cellContext: CellContext<Assembly, unknown>
): string {
  const value = cellContext.getValue();
  return formatNumber(value);
}

/**
 * Returns Ploidy as a comma separated string.
 * @param cellContext - Cell context.
 * @returns Ploidy as a comma separated string.
 */
export function renderPloidy(
  cellContext: CellContext<Assembly, unknown>
): string {
  return cellContext.row.original.ploidy.join(", ");
}
