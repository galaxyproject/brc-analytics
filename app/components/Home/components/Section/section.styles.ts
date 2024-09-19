import { inkLight } from "@databiosphere/findable-ui/lib/styles/common/mixins/colors";
import { textBodyLarge400 } from "@databiosphere/findable-ui/lib/styles/common/mixins/fonts";
import styled from "@emotion/styled";

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
  ${textBodyLarge400};
  color: ${inkLight};
  margin: 0;
`;
