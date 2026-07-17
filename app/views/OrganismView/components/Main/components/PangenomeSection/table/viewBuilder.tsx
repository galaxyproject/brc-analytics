import type { PangenomeMember } from "@/apis/catalog/brc-analytics-catalog/common/pangenome";
import { LevelCell } from "@brc-analytics/core/components/Table/components/TableCell/components/LevelCell/levelCell";
import { CellContext } from "@tanstack/react-table";
import { JSX } from "react";

/**
 * Renders the assembly level cell — a tiered bar indicator plus the label.
 * @param cellContext - Cell context.
 * @param cellContext.row - Row context.
 * @returns The level cell.
 */
export function renderLevel({
  row,
}: CellContext<PangenomeMember, unknown>): JSX.Element {
  const { levelFilledCount, levelLabel } = row.original;
  return <LevelCell filledCount={levelFilledCount} label={levelLabel} />;
}
