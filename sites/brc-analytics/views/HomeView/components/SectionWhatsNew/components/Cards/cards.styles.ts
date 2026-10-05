import { CARD_WIDTH } from "@brc/views/HomeView/components/SectionWhatsNew/components/Cards/constants";
import { FONT } from "@databiosphere/findable-ui/lib/styles/common/constants/font";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import styled from "@emotion/styled";
import { Card as MCard } from "@mui/material";

export const StyledCard = styled(MCard)`
  flex: 0 0 min(${CARD_WIDTH}px, 100%);
  padding: 24px;

  h1,
  h2,
  h3 {
    color: ${PALETTE.INK_MAIN};
    font: ${FONT.BODY_LARGE_500};
    margin: 0;
  }

  p {
    color: ${PALETTE.INK_LIGHT};
    font: ${FONT.BODY_SMALL_400_2_LINES};
    margin: 8px 0 0;
  }

  .MuiCardActions-root {
    font: ${FONT.BODY_500};
    gap: 16px;
    margin-top: 16px;
    padding: 0;
  }
` as typeof MCard;
