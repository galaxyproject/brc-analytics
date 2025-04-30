import { mediaTabletUp } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import { textBodyLarge4002Lines } from "@databiosphere/findable-ui/lib/styles/common/mixins/fonts";
import styled from "@emotion/styled";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";

export const Figure = styled.figure`
  margin: 16px 0;

  img {
    margin: 0 auto;
    width: 100%;
  }

  figcaption {
    ${textBodyLarge4002Lines};
    color: ${PALETTE.INK_LIGHT};
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
