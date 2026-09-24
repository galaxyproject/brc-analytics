import type { LayoutSpacing } from "@databiosphere/findable-ui/lib/hooks/UseLayoutSpacing/types";
import { bpDownMd } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import styled from "@emotion/styled";

// Sized to the viewport less the header and footer, so the page itself never
// scrolls and each column scrolls on its own.
export const StyledLayout = styled("div", {
  shouldForwardProp: (prop) => prop !== "bottom" && prop !== "top",
})<LayoutSpacing>`
  display: grid;
  grid-template-columns: 296px minmax(0, 1fr) 360px;
  height: calc(100dvh - ${({ bottom, top }) => top + bottom}px);
  width: 100%;

  ${bpDownMd} {
    grid-template-columns: minmax(0, 1fr);
    height: auto;
  }
`;
