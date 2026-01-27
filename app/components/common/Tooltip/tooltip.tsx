import { JSX } from "react";
import { Tooltip as MTooltip, TooltipProps } from "@mui/material";

export const Tooltip = ({
  children,
  ...props /* Mui TooltipProps */
}: TooltipProps): JSX.Element => {
  return (
    <MTooltip {...props}>
      <span>{children}</span>
    </MTooltip>
  );
};
