import { FONT } from "@databiosphere/findable-ui/lib/styles/common/constants/font";
import styled from "@emotion/styled";

// See https://github.com/emotion-js/emotion/issues/1105.
// See https://github.com/emotion-js/emotion/releases/tag/%40emotion%2Fcache%4011.10.2.
const ignoreSsrWarning =
  "/* emotion-disable-server-rendering-unsafe-selector-warning-please-do-not-use-this-the-warning-exists-for-a-reason */";

export const StyledH2 = styled("h2")`
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  margin: 16px 0 8px 0;

  &:first-child:not(style)${ignoreSsrWarning} {
    margin-top: 0;
  }
`;

export const StyledP = styled("p")`
  font: ${FONT.BODY_400_2_LINES};
`;

export const StyledUL = styled("ul")`
  font: ${FONT.BODY_400_2_LINES};
  margin: 0;
  padding-left: 24px;

  li {
    margin: 4px 0;

    &:first-of-type {
      margin-top: 0;
    }

    &:last-of-type {
      margin-bottom: 0;
    }
  }
`;
