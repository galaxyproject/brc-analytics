import styled from "@emotion/styled";
import { Button } from "@mui/material";

// The page hero lays its actions out in a flex row on desktop and a grid on
// mobile; keep the button its own size in both rather than stretching to the
// title's height or the full width.
export const StyledButton = styled(Button)`
  align-self: center;
  justify-self: flex-start;
`;

// The tooltip's anchor when the button is wrapped in one; sized to the button
// the same way, so the tooltip opens over the button.
export const StyledTooltipAnchor = styled.span`
  align-self: center;
  justify-self: flex-start;
`;
