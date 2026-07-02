import { Tooltip as MTooltip, TooltipProps } from "@mui/material";
import { JSX } from "react";
import { SLOT_PROPS } from "./constants";
import { StyledSpan } from "./tooltip.styles";

export const Tooltip = ({
  children,
  ...props /* Mui TooltipProps */
}: TooltipProps): JSX.Element => {
  return (
    <MTooltip slotProps={SLOT_PROPS} {...props}>
      <StyledSpan>{children}</StyledSpan>
    </MTooltip>
  );
};
