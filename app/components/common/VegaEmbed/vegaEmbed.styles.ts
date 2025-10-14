import { bpUpSm } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import { FONT } from "@databiosphere/findable-ui/lib/styles/common/constants/font";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import styled from "@emotion/styled";

export const VegaEmbedContainer = styled.figure`
  margin: 16px 0;

  .vega-container {
    margin: 0 auto;
    width: 100%;
  }

  .error {
    color: ${PALETTE.ERROR};
    font: ${FONT.BODY_LARGE_400};
    margin-bottom: 16px;
  }

  figcaption {
    color: ${PALETTE.INK_LIGHT};
    display: block;
    font: ${FONT.BODY_LARGE_400_2_LINES};
    margin-top: 32px;
    text-align: justify;

    ${bpUpSm} {
      display: flex;
      gap: 0 64px;
      margin-top: 52px;
      text-align: unset;

      span {
        flex: 1;
      }
    }
  }
`;
