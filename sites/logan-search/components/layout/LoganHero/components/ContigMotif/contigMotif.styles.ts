import { bpDownSm } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import styled from "@emotion/styled";

/* Faded out towards the left, where the text sits, so the bars only ever run
   behind empty band. On a phone the text takes the full width, so the whole
   field drops back further instead. */
export const MotifSvg = styled.svg`
  height: 100%;
  inset: 0;
  mask-image: linear-gradient(to right, transparent 35%, #000 85%);
  pointer-events: none;
  position: absolute;
  width: 100%;
  z-index: -1;

  ${bpDownSm} {
    mask-image: none;
    opacity: 0.35;
  }
`;
