import { TooltipProps } from "@mui/material";

export const SLOT_PROPS: TooltipProps["slotProps"] = {
  popper: {
    modifiers: [{ name: "preventOverflow", options: { padding: 8 } }],
  },
};
