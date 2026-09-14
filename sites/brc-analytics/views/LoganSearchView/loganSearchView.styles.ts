import { GridPaperSection } from "@databiosphere/findable-ui/lib/components/common/Section/section.styles";
import styled from "@emotion/styled";

export const SearchSection = styled(GridPaperSection)`
  && {
    /* The page's <main> sets align-items: flex-start, so without an explicit
       stretch this section collapses to its content width -- max-width and
       the auto margins below never come into play at all. */
    align-self: stretch;
    margin: 0 auto;
    max-width: 1200px;
    padding: 32px 20px;
    width: 100%;
  }
`;

export const SearchContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
`;
