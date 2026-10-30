import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import {
  bpDownMd,
  bpUpMd,
} from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import styled from "@emotion/styled";
import { Stack } from "@mui/material";
import { FOOTER_HEIGHT_PROPERTY, GAP } from "./constants";

// The suggestions, any error and the composer, at the end of the conversation.
// On narrow screens they are kept together at its foot, and a short
// conversation leaves the spare room above them. On wider screens they lay out
// as the conversation's own items, so the suggestions follow the messages and
// only the footer pins.
export const StyledEnd = styled(Stack)`
  gap: ${GAP}px;

  ${bpDownMd} {
    margin-top: auto;
  }

  ${bpUpMd} {
    display: contents;
  }
`;

// Any error and the composer. On wider screens the chat column scrolls the
// conversation, and they stay pinned to its foot, with the spare room of a
// short conversation above them, while the messages and suggestions scroll
// behind them. The shadow paints over the gap above, so nothing shows between
// the footer and what scrolls behind it.
export const StyledFooter = styled(Stack)`
  gap: ${GAP}px;

  ${bpUpMd} {
    background-color: ${PALETTE.COMMON_WHITE};
    bottom: 0;
    box-shadow: 0 -${GAP}px 0 ${PALETTE.COMMON_WHITE};
    margin-top: auto;
    padding-bottom: 16px;
    position: sticky;

    // Its own controls are already in view, pinned where they are.
    && * {
      scroll-margin-bottom: 0;
    }
  }
`;

// Fills at least its column, so a short conversation still keeps the composer
// at the bottom, and grows with the conversation, so the column (or, on narrow
// screens, the page) scrolls it.
export const StyledStack = styled(Stack)`
  flex: 1 0 auto;
  gap: ${GAP}px;

  // On narrow screens the composer scrolls with the conversation, and is kept
  // clear of the bottom edge when brought into view.
  ${bpDownMd} {
    scroll-margin-bottom: 16px;
  }

  // On wider screens whatever is brought into view, such as a link focused
  // from the keyboard, is kept clear of the footer pinned beneath it: its
  // height and the gap its shadow paints over. Until the footer is measured the
  // margin is invalid and falls back to its initial 0, so nothing is kept
  // clear; a fallback height would keep the gap clear instead.
  ${bpUpMd} {
    * {
      scroll-margin-bottom: calc(var(${FOOTER_HEIGHT_PROPERTY}) + ${GAP}px);
    }
  }
`;
