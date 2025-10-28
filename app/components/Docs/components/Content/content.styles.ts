import { SectionContent } from "../../../content/content.styles";
import styled from "@emotion/styled";

// See https://github.com/emotion-js/emotion/issues/1105.
// See https://github.com/emotion-js/emotion/releases/tag/%40emotion%2Fcache%4011.10.2.
const ignoreSsrWarning =
  "/* emotion-disable-server-rendering-unsafe-selector-warning-please-do-not-use-this-the-warning-exists-for-a-reason */";
export const StyledSectionContent = styled(SectionContent)`
  margin-top: 0;

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    &:hover {
      a {
        opacity: 1;
      }
    }
  }

  > *:first-child:not(style) ${ignoreSsrWarning} {
    margin-top: 0;
  }
`;
