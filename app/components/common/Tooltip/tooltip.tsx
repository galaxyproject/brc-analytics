import { Tooltip as MTooltip, TooltipProps } from "@mui/material";
import { JSX } from "react";

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
