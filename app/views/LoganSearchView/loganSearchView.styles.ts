import { GridPaperSection } from "@databiosphere/findable-ui/lib/components/common/Section/section.styles";
import styled from "@emotion/styled";

export const SearchSection = styled(GridPaperSection)`
  && {
    margin: 0 auto;
    max-width: 1200px;
    padding: 32px 20px;
  }
`;

export const SearchContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin: 0 auto;
  max-width: 900px;
`;
