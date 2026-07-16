import { ToggleButton } from "@mui/material";
import { RowData } from "@tanstack/react-table";
import { JSX } from "react";
import { StyledToggleButtonGroup } from "./columnPresetToggle.styles";
import { TOGGLE_BUTTON_GROUP_PROPS } from "./constants";
import { useColumnPresets } from "./hooks/UseColumnPresets/hook";
import type { Props } from "./types";

/**
 * Segmented control that switches the assemblies table between column presets.
 * @param props - Component props.
 * @param props.presets - Available column presets.
 * @param props.table - Table instance whose column visibility the presets drive.
 * @returns Column preset toggle.
 */
export const ColumnPresetToggle = <T extends RowData>({
  presets,
  table,
}: Props<T>): JSX.Element => {
  const { onChange, value } = useColumnPresets(presets, table);
  return (
    <StyledToggleButtonGroup
      {...TOGGLE_BUTTON_GROUP_PROPS}
      onChange={onChange}
      value={value}
    >
      {presets.map((preset) => (
        <ToggleButton key={preset.key} value={preset.key}>
          {preset.label}
        </ToggleButton>
      ))}
    </StyledToggleButtonGroup>
  );
};
