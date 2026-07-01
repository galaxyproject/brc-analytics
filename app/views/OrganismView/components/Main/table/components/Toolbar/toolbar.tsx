import { RowData } from "@tanstack/react-table";
import { JSX } from "react";
import { ColumnPresetToggle } from "./components/ColumnPresetToggle/columnPresetToggle";
import { StyledToolbar } from "./toolbar.styles";
import type { Props } from "./types";

/**
 * Toolbar above the assemblies table; hosts the column preset toggle. Renders
 * nothing when there are no presets to switch between.
 * @param props - Component props.
 * @param props.columnPresets - Column presets for the assemblies table.
 * @param props.table - Table instance.
 * @returns Assemblies table toolbar.
 */
export const Toolbar = <T extends RowData>({
  columnPresets,
  table,
}: Props<T>): JSX.Element | null => {
  // Nothing to switch between with fewer than two presets.
  if (columnPresets.length < 2) return null;
  return (
    <StyledToolbar>
      <ColumnPresetToggle presets={columnPresets} table={table} />
    </StyledToolbar>
  );
};
