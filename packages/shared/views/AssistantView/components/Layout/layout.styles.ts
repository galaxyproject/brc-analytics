import type { LayoutSpacing } from "@databiosphere/findable-ui/lib/hooks/UseLayoutSpacing/types";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import { bpDownMd } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import styled from "@emotion/styled";

// Sized to the viewport less the header and footer, so the page itself never
// scrolls and each column scrolls on its own. On narrow screens the columns
// become tabs: the tab bar, pinned beneath the header, then whichever column
// is active, at its full height, with the page scrolling and the footer after
// it. The layout fills at least the viewport below the header, so a short tab
// doesn't pull the footer up. The small viewport height keeps it from resizing
// as the browser's toolbar shows and hides.
export const StyledLayout = styled("div", {
  shouldForwardProp: (prop) => prop !== "bottom" && prop !== "top",
})<LayoutSpacing>`
  display: grid;
  grid-template-columns: 328px minmax(0, 1fr) 360px;
  height: calc(100dvh - ${({ bottom, top }) => top + bottom}px);
  width: 100%;

  ${bpDownMd} {
    background-color: ${PALETTE.COMMON_WHITE};
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto 1fr;
    height: auto;
    min-height: calc(100svh - ${({ top }) => top}px);
  }
`;
