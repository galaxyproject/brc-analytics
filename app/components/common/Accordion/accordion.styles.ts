import { SHADOWS } from "@databiosphere/findable-ui/lib/styles/common/constants/shadows";
import styled from "@emotion/styled";
import { Accordion as MAccordion } from "@mui/material";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import { FONT } from "@databiosphere/findable-ui/lib/styles/common/constants/font";

export const StyledAccordion = styled(MAccordion)`
  box-shadow: ${SHADOWS["01"]} !important;
  display: grid;
  grid-column: 1 / -1;
  padding: 12px 0;

  .MuiAccordionSummary-root {
    flex-direction: row;
    min-height: 0;
    padding: 8px 20px;

    .MuiAccordionSummary-content {
      font: ${FONT.BODY_LARGE_500};
      margin: 0;
    }
  }

  .MuiAccordionDetails-root {
    color: ${PALETTE.INK_LIGHT};
    font: ${FONT.BODY_LARGE_400_2_LINES};
    margin: 0;
    padding: 0 20px 8px;

    > *:last-child {
      margin-bottom: 0;
    }
  }
` as typeof MAccordion;
