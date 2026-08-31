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

export const StyledSection = styled.section`
  ${section};
  background-color: ${PALETTE.SMOKE_LIGHTEST};
  border-bottom: 1px solid ${PALETTE.SMOKE_MAIN};
  border-top: 1px solid ${PALETTE.SMOKE_MAIN};
  overflow: hidden; /* clips the cards bleeding past the content column */
  padding: 64px 0 80px;
`;

export const Headline = styled.div`
  ${sectionLayout};
  align-items: center;
  display: flex;
  justify-content: space-between;
  padding: 0 16px;
`;

export const Arrows = styled.div`
  display: flex;
  gap: 8px;
`;

/**
 * Sized to the content column, which the cards bleed past to the right as the
 * design shows: the row overflows the viewport rather than stopping short, and
 * the section clips it at the edge of the page. Padding on both sides keeps the
 * last card off the edge of the screen once the row has been paged to its end.
 */
export const CardsViewport = styled.div`
  margin-top: 32px;
  padding-left: max(16px, calc((100% - ${CONTENT_WIDTH}px) / 2));
  padding-right: 16px;
  /* Vertical scrolling stays with the browser; horizontal drags are swipes. */
  touch-action: pan-y;
`;

export const CardsRow = styled.div<{ offset: number }>`
  display: flex;
  gap: ${CARD_GAP}px;
  transform: translateX(${({ offset }) => -offset}px);
  transition: transform 300ms ease-in-out;
`;
