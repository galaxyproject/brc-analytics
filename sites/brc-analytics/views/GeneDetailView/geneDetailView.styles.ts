import { GridPaperSection } from "@databiosphere/findable-ui/lib/components/common/Section/section.styles";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import styled from "@emotion/styled";

export const DetailSection = styled(GridPaperSection)`
  && {
    align-self: stretch;
    margin: 0 auto;
    max-width: 1200px;
    padding: 32px 20px;
    width: 100%;
  }
`;

export const FieldList = styled.dl`
  display: grid;
  gap: 16px 24px;
  grid-template-columns: max-content 1fr;
  margin: 0;
`;

export const FieldLabel = styled.dt`
  color: ${PALETTE.INK_LIGHT};
  font-size: 13px;
  font-weight: 500;
  text-transform: uppercase;
`;

export const FieldValue = styled.dd`
  margin: 0;
`;
