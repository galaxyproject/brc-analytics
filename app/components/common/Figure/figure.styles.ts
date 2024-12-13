import { mediaTabletUp } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import { inkLight } from "@databiosphere/findable-ui/lib/styles/common/mixins/colors";
import { textBodyLarge4002Lines } from "@databiosphere/findable-ui/lib/styles/common/mixins/fonts";
import styled from "@emotion/styled";

export const Figure = styled.figure`
  margin: 16px 0;

  img {
    margin: 0 auto;
    width: 100%;
  }

  figcaption {
    ${textBodyLarge4002Lines};
    color: ${inkLight};
    display: block;
    margin-top: 32px;
    text-align: justify;

    ${mediaTabletUp} {
      display: flex;
      gap: 0 64px;
      margin-top: 52px;
      text-align: unset;
    }
  }
`;
