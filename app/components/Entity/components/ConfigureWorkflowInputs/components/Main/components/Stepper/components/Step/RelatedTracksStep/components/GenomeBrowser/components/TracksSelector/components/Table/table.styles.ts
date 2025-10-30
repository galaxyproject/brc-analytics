import { RoundedPaper } from "@databiosphere/findable-ui/lib/components/common/Paper/components/RoundedPaper/roundedPaper";
import styled from "@emotion/styled";
import { Accordion } from "@mui/material";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";

export const StyledAccordion = styled(Accordion)`
  background-color: ${PALETTE.COMMON_WHITE};
  border-radius: 8px;
  box-shadow: 0 0 0 1px ${PALETTE.SMOKE_MAIN} !important;
  overflow: hidden;

  .MuiAccordionSummary-root {
    padding: 0 16px;

    .MuiAccordionSummary-expandIconWrapper.Mui-expanded {
      transform: rotate(90deg);
    }
  }

  .MuiAccordionDetails-root {
    margin: 0;
    padding: 0;

    .MuiTableContainer-root {
      background-color: ${PALETTE.SMOKE_MAIN};
      border-top: 1px solid ${PALETTE.SMOKE_MAIN};
      display: grid;
      gap: 1px;
    }
  }
`;

export const StyledRoundedPaper = styled(RoundedPaper)`
  background-color: ${PALETTE.SMOKE_MAIN};
  display: grid;
  flex: 1;
  gap: 1px;
  max-height: 100%;

  .MuiTableContainer-root {
    height: 100%;

    .MuiTableCell-root {
      word-break: break-word;
    }
  }
`;
