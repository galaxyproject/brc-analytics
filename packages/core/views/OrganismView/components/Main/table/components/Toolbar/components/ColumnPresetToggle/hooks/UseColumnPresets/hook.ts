import type { ColumnPreset } from "@brc-analytics/core/views/OrganismView/components/Main/types";
import { useToggleButtonGroup } from "@databiosphere/findable-ui/lib/components/common/ToggleButtonGroup/hooks/UseToggleButtonGroup/hook";
import type { RowData, Table } from "@tanstack/react-table";
import { type MouseEvent, useCallback } from "react";
import type { UseColumnPresets } from "./types";

/**
 * Tracks the active column preset and applies its visibility to the table. The
 * first preset is active on mount (matching the table's initial state). An
 * exclusive toggle emits `null` when the active button is re-clicked; that
 * deselection is ignored so a preset is always applied.
 * @param presets - Available column presets.
 * @param table - Table instance whose column visibility the presets drive.
 * @returns Active preset value and the toggle change handler.
 */
export const useColumnPresets = <T extends RowData>(
  presets: ColumnPreset[],
  table: Table<T>
): UseColumnPresets => {
  const { onChange: onValueChange, value } = useToggleButtonGroup<string>(
    presets[0]?.key
  );

  const onChange = useCallback(
    (event: MouseEvent<HTMLElement>, key: string | null): void => {
      onValueChange?.(event, key);
      const preset = presets.find((preset) => preset.key === key);
      if (preset) table.setColumnVisibility(preset.columnVisibility);
    },
    [onValueChange, presets, table]
  );

  return { onChange, value };
};
