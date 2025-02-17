import {
  inkLight,
  white,
} from "@databiosphere/findable-ui/lib/styles/common/mixins/colors";
import styled from "@emotion/styled";
import { Accordion } from "@mui/material";
import { smokeLightest } from "@databiosphere/findable-ui/lib/theme/common/palette";
import { elevation01 } from "@databiosphere/findable-ui/lib/theme/common/shadows";
import { mediaTabletDown } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";

export const StyledAccordion = styled(Accordion)`
  &.MuiAccordion-root {
    background-color: ${white};
    box-shadow: ${elevation01};

    .MuiAccordion-heading {
      display: block;
      padding: 20px;

      .MuiAccordionSummary-root {
        flex-direction: row;
        gap: 16px;

        .MuiAccordionSummary-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin: 0;

          .MuiTypography-root {
            margin: 0;

            &.MuiTypography-text-heading-small {
              font-size: 16px;
              letter-spacing: normal;
              line-height: 24px;
            }
          }
        }

        .MuiAccordionSummary-expandIconWrapper {
          .MuiSvgIcon-root {
            transform: rotate(90deg);
          }

          .MuiChip-root {
            color: ${inkLight};
          }
        }

        &.Mui-disabled {
          opacity: 1;
        }
      }
    }

    .MuiAccordionDetails-root {
      border-radius: 0 0 8px 8px; // bottom corners only
      margin: 0;
      overflow: hidden; // simple way to manage workflow loading panel bleed
      padding: 0;

      ${mediaTabletDown} {
        border-radius: 0;
      }
    }

    &.Mui-disabled {
      background-color: ${smokeLightest};
    }
  }
` as typeof Accordion;
