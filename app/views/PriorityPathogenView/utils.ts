import { ChipProps } from "@mui/material";
import { CHIP_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/chip";

/**
 * Returns the color for the active status of the outbreak.
 * @param active - The active status of the outbreak.
 * @returns The color for the active status of the outbreak.
 */
export function getActiveColor(active: boolean): ChipProps["color"] {
  switch (active) {
    case true:
      return CHIP_PROPS.COLOR.SUCCESS;
    case false:
      return CHIP_PROPS.COLOR.WARNING;
    default:
      return CHIP_PROPS.COLOR.DEFAULT;
  }
}

/**
 * Returns the label for the outbreak's active status.
 * @param active - The active status of the outbreak.
 * @returns The label for the active status of the outbreak.
 */
export function getActiveLabel(active: boolean): string {
  switch (active) {
    case true:
      return "Active";
    case false:
      return "Inactive";
    default:
      return "Unknown";
  }
}
