import { CellContext } from "@tanstack/react-table";
import { JSX } from "react";
import type { PangenomeMember } from "../../../../../../../apis/catalog/brc-analytics-catalog/common/pangenome";
import { LevelCell } from "../../../../../../../components/Table/components/TableCell/components/LevelCell/levelCell";

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
