import { OUTBREAK_PRIORITY } from "app/apis/catalog/brc-analytics-catalog/common/schema-entities";
import { ChipProps } from "@mui/material";
import { CHIP_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/chip";
import { CHIP_PROPS as APP_CHIP_PROPS } from "../../../../styles/common/mui/chip";

/**
 * Returns the color for the priority of the outbreak.
 * @param priority - The priority of the outbreak.
 * @returns The color for the priority of the outbreak.
 */
export function getPriorityColor(
  priority: OUTBREAK_PRIORITY | null
): ChipProps["color"] {
  switch (priority) {
    case OUTBREAK_PRIORITY.CRITICAL:
      return CHIP_PROPS.COLOR.WARNING;
    case OUTBREAK_PRIORITY.HIGH:
      return APP_CHIP_PROPS.COLOR.CAUTION;
    case OUTBREAK_PRIORITY.HIGHEST:
      return APP_CHIP_PROPS.COLOR.ALERT;
    case OUTBREAK_PRIORITY.MODERATE:
      return CHIP_PROPS.COLOR.DEFAULT;
    case OUTBREAK_PRIORITY.MODERATE_HIGH:
      return CHIP_PROPS.COLOR.DEFAULT;
    default:
      return APP_CHIP_PROPS.COLOR.NONE;
  }
}

/**
 * Returns the label for the priority of the outbreak.
 * @param priority - The priority of the outbreak.
 * @returns The label for the priority of the outbreak.
 */
export function getPriorityLabel(priority: OUTBREAK_PRIORITY | null): string {
  switch (priority) {
    case OUTBREAK_PRIORITY.CRITICAL:
      return "Critical Priority";
    case OUTBREAK_PRIORITY.HIGH:
      return "High Priority";
    case OUTBREAK_PRIORITY.HIGHEST:
      return "Highest Priority";
    case OUTBREAK_PRIORITY.MODERATE:
      return "Moderate Priority";
    case OUTBREAK_PRIORITY.MODERATE_HIGH:
      return "Moderate High Priority";
    default:
      return "Unprioritized";
  }
}
