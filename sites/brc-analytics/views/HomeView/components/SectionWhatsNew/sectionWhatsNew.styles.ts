import {
  CARD_GAP,
  CONTENT_WIDTH,
} from "@brc/views/HomeView/components/SectionWhatsNew/components/Cards/constants";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import styled from "@emotion/styled";
import {
  section,
  sectionLayout,
} from "@repo/shared/components/layout/Section/section.styles";

/** Space kept between the content column and the edge of the screen. */
const GUTTER = 16;

export const StyledSection = styled.section`
  ${section};
  background-color: ${PALETTE.SMOKE_LIGHTEST};
  border-bottom: 1px solid ${PALETTE.SMOKE_MAIN};
  border-top: 1px solid ${PALETTE.SMOKE_MAIN};
  /* Clipped, not hidden: an "overflow: hidden" box is still scrollable, so
     focus landing on a card paged out of view would scroll the section sideways
     with nothing to scroll it back. */
  overflow: clip;
  padding: 64px 0 80px;
`;

export const Headline = styled.div`
  ${sectionLayout};
  align-items: center;
  display: flex;
  justify-content: space-between;
  padding: 0 ${GUTTER}px;
`;

export const Arrows = styled.div`
  display: flex;
  gap: 8px;
`;

/**
 * Sized to the content column, which the cards bleed past as the design shows:
 * the row overflows the viewport rather than stopping short, and the section
 * clips it at the edge of the page. Padding on both sides keeps the last card
 * off the edge of the screen once the row has been paged to its end.
 */
export const CardsViewport = styled.div`
  margin-top: 32px;
  padding-left: max(${GUTTER}px, calc((100% - ${CONTENT_WIDTH}px) / 2));
  padding-right: ${GUTTER}px;
  /* Vertical scrolling and zooming stay with the browser; horizontal drags are
     swipes. */
  touch-action: pan-y pinch-zoom;
`;

export const CardsRow = styled.div<{ offset: number }>`
  display: flex;
  gap: ${CARD_GAP}px;
  transform: translateX(${({ offset }) => -offset}px);
  transition: transform 300ms ease-in-out;
`;
