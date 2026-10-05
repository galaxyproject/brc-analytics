import { ScientificName } from "@repo/shared/components/ScientificName/scientificName";
import { type CellContext } from "@tanstack/react-table";
import { type ReactNode } from "react";

/**
 * Renders a table cell value as a scientific name, passing through absent
 * values so a missing name doesn't render an empty italic element.
 * @param ctx - Cell context.
 * @returns Scientific name element, or null when the value is absent.
 */
export function renderScientificName<T>(
  ctx: CellContext<T, unknown>
): ReactNode {
  const value = ctx.getValue<string | undefined>();
  return value ? <ScientificName>{value}</ScientificName> : null;
}
