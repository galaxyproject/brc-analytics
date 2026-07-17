import { Tooltip as MTooltip, TooltipProps } from "@mui/material";
import { JSX } from "react";
import { SLOT_PROPS } from "./constants";
import { StyledSpan } from "./tooltip.styles";

export const Tooltip = ({
  children,
  slotProps,
  ...props /* Mui TooltipProps */
}: TooltipProps): JSX.Element => {
  return (
    // Merge a caller's slotProps over the defaults (rather than letting the
    // spread replace them) so the preventOverflow default is preserved.
    <MTooltip slotProps={{ ...SLOT_PROPS, ...slotProps }} {...props}>
      <StyledSpan>{children}</StyledSpan>
    </MTooltip>
  );
};
