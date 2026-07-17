import { TooltipProps } from "@mui/material";

export interface Props {
  timeoutDelay?: number;
  tooltipProps?: Partial<TooltipProps>;
  value: boolean | number | string;
}
