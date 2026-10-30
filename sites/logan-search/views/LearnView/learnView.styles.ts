import { HEADER_HEIGHT_VAR } from "@databiosphere/findable-ui/lib/components/Layout/components/Header/common/constants";
import styled from "@emotion/styled";

// Past this the contents list fits beside a full-width article.
const OUTLINE_MIN_WIDTH = 1100;

/* The article and its contents list on the same 1200px frame as the hero and
   every other page, so the article starts under the title at any width. The
   shared docs grid centers the article on the whole window instead. */
export const LearnBody = styled.div`
  align-self: stretch;
  box-sizing: border-box;
  display: grid;
  gap: 40px;
  grid-template-columns: minmax(0, 756px);
  margin: 0 auto;
  max-width: 1200px;
  padding: 64px 20px;
  width: 100%;

  @media (min-width: ${OUTLINE_MIN_WIDTH}px) {
    grid-template-columns: minmax(0, 756px) 242px;
    justify-content: space-between;
  }
`;

/* The shared docs Content spans every column of a grid it sits in, so it gets
   a cell of its own. */
export const ArticleSlot = styled.div`
  min-width: 0;
`;

export const OutlineSlot = styled.aside`
  align-self: start;
  display: none;
  position: sticky;
  top: calc(${HEADER_HEIGHT_VAR} + 16px);

  @media (min-width: ${OUTLINE_MIN_WIDTH}px) {
    display: block;
  }
`;
