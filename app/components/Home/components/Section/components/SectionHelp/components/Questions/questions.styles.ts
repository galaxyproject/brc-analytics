import { mediaTabletUp } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import { inkLight } from "@databiosphere/findable-ui/lib/styles/common/mixins/colors";
import {
  textBodyLarge4002Lines,
  textBodyLarge500,
} from "@databiosphere/findable-ui/lib/styles/common/mixins/fonts";
import { elevation01 } from "@databiosphere/findable-ui/lib/theme/common/shadows";
import styled from "@emotion/styled";
import { Accordion as MAccordion } from "@mui/material";
import { sectionGrid } from "../../../../../../../Layout/components/AppLayout/components/Section/section.styles";

export const Grid = styled.div`
  ${sectionGrid};
  grid-column: 1 / -1;
  grid-template-columns: 1fr;

  ${mediaTabletUp} {
    grid-column: 6 / -1;
    grid-template-columns: repeat(7, 1fr);
  }
`;

export const StyledAccordion = styled(MAccordion)`
  box-shadow: ${elevation01} !important;
  display: grid;
  grid-column: 1 / -1;
  padding: 12px 0;

  .MuiAccordionSummary-root {
    flex-direction: row;
    min-height: 0;
    padding: 8px 20px;

    .MuiAccordionSummary-content {
      ${textBodyLarge500};
      margin: 0;
    }
  }

  .MuiAccordionDetails-root {
    ${textBodyLarge4002Lines};
    color: ${inkLight};
    margin: 0;
    padding: 0 20px 8px;
  }
` as typeof MAccordion;
