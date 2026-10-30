import type { CSSObject } from "@emotion/react";
import styled from "@emotion/styled";
import { Stack } from "@mui/material";
import { visuallyHidden } from "@mui/utils";
import { focusVisibleOutline } from "@repo/shared/styles/mixins/focus";

// MUI types its style object as React CSS properties; it is a plain CSS object.
export const StyledSenderLabel = styled.span(visuallyHidden as CSSObject);

export const StyledStack = styled(Stack)`
  gap: 24px;
  // Contains the visually hidden sender labels, which are absolutely
  // positioned, so they scroll with their messages.
  position: relative;

  ${focusVisibleOutline}
`;
