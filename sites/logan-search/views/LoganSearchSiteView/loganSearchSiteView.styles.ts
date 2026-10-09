import styled from "@emotion/styled";
import { HERO_OVERLAP } from "@logan/components/layout/LoganHero/loganHero.styles";

/* Pulled up over the bottom of the hero band so the page reads search-first
   and the form starts above the fold. Transparent, so only the cards inside
   sit over the band; positioned so they paint above it. */
export const SearchSection = styled.section`
  /* The page's <main> sets align-items: flex-start, so without an explicit
     stretch this section collapses to its content width, and max-width and
     the auto margins below never come into play at all. */
  align-self: stretch;
  box-sizing: border-box;
  margin: -${HERO_OVERLAP}px auto 0;
  max-width: 1200px;
  padding: 0 20px 32px;
  position: relative;
  width: 100%;
  z-index: 1;
`;

export const SearchContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
`;
