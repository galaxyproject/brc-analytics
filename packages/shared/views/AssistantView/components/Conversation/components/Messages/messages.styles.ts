import { bpDownMd } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import type { CSSObject } from "@emotion/react";
import styled from "@emotion/styled";
import { Stack } from "@mui/material";
import { visuallyHidden } from "@mui/utils";
import { focusVisibleOutline } from "@repo/shared/styles/mixins/focus";

// MUI types its style object as React CSS properties; it is a plain CSS object.
export const StyledSenderLabel = styled.span(visuallyHidden as CSSObject);

export const StyledStack = styled(Stack)`
  flex: 1;
  gap: 24px;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior-y: contain;
  // Contains the visually hidden sender labels, which are absolutely
  // positioned, so they scroll with their messages.
  position: relative;

  ${focusVisibleOutline}

  // On narrow screens the chat tab scrolls as a whole, so the list takes its
  // full height rather than scrolling on its own.
  ${bpDownMd} {
    flex: none;
    overflow-y: visible;
  }
`;
