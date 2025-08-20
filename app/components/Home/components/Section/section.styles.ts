import styled from "@emotion/styled";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import { FONT } from "@databiosphere/findable-ui/lib/styles/common/constants/font";

export const SectionHeadline = styled.div`
  display: grid;
  gap: 16px;
`;

export const SectionTitle = styled.h2`
  font-family: "Inter Tight", sans-serif;
  font-size: 32px;
  font-weight: 500;
  line-height: 40px;
  margin: 0;
`;

export const SectionSubtitle = styled.h3`
  color: ${PALETTE.INK_LIGHT};
  font: ${FONT.BODY_LARGE_400};
  margin: 0;
`;
