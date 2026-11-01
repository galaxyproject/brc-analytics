import { BackPageView } from "@databiosphere/findable-ui/lib/components/Layout/components/BackPage/backPageView.styles";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import styled from "@emotion/styled";

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

// findable-ui's back page grid, as the assembly and organism pages use, with
// its rows kept to their content's height.
export const GeneBackPageView = styled(BackPageView)`
  align-content: start;
`;
