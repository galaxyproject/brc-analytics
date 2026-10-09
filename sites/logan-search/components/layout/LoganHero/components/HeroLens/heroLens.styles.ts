import { bpDownMd } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import styled from "@emotion/styled";

/* Sits to the right of the title block, above the motif and clear of the
   search card that rides up over the bottom of the band. Below md the text
   needs the width, so the lens goes. */
export const LensSvg = styled.svg`
  filter: drop-shadow(0 10px 18px rgb(59 23 130 / 0.18));
  height: 184px;
  pointer-events: none;
  position: absolute;
  right: 56px;
  top: 10px;
  width: 184px;

  ${bpDownMd} {
    display: none;
  }
`;
