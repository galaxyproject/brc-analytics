import type { PangenomeMember } from "@brc/apis/pangenome";
import { LevelCell } from "@repo/shared/components/Table/components/TableCell/components/LevelCell/levelCell";
import { type CellContext } from "@tanstack/react-table";
import { type JSX } from "react";

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
