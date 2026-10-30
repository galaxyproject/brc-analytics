import type { TooltipProps } from "@mui/material";
import type { ClearableField } from "@repo/shared/services/api-client/types";

/**
 * Fields the user chose in conversation, and so can clear from the panel. The
 * rest are derived from the workflow and assembly and recomputed every turn,
 * so clearing one would not stick.
 */
export const CLEARABLE_FIELDS: ReadonlySet<string> = new Set<ClearableField>([
  "analysis_type",
  "assembly",
  "data_source",
  "organism",
  "workflow",
]);

export const TOOLTIP_PROPS: Omit<TooltipProps, "children" | "title"> = {
  arrow: true,
  disableInteractive: true,
  slotProps: {
    popper: {
      modifiers: [
        {
          name: "offset",
          options: {
            offset: [0, -6],
          },
        },
        {
          name: "preventOverflow",
          options: { padding: 8 },
        },
      ],
    },
  },
};
