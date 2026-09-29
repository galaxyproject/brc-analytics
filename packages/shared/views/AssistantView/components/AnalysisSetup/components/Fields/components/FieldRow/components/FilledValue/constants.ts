import type { TooltipProps } from "@mui/material";
import type { SchemaFieldKey } from "@repo/shared/views/AssistantView/components/AnalysisSetup/types";

/**
 * Fields the user chose in conversation, and so can clear from the panel. The
 * rest are derived from the workflow and assembly and recomputed every turn,
 * so clearing one would not stick.
 */
export const CLEARABLE_FIELDS: ReadonlySet<SchemaFieldKey> = new Set([
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
