import styled from "@emotion/styled";
import { GridPaperSection } from "@databiosphere/findable-ui/lib/components/common/Section/section.styles";

export const TestSection = styled(GridPaperSection)`
  && {
    margin: 0 auto;
    max-width: 1200px;
    padding: 32px 20px;
  }
`;

export const TestContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin: 0 auto;
  max-width: 800px;
`;
