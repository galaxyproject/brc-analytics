import styled from "@emotion/styled";
import { Stepper } from "@mui/material";
import { FONT } from "@databiosphere/findable-ui/lib/styles/common/constants/font";

export const StyledStepper = styled(Stepper)`
  gap: 16px;

  .MuiStep-root {
    .MuiStepLabel-labelContainer {
      display: grid;
      gap: 4px 24px;
      grid-template-columns: 1fr auto;

      .MuiTypography-root {
        grid-column: 1;
      }

      .MuiButton-root {
        font: ${FONT.BODY_400};
        grid-column: 2;
        grid-row: 1 / span 2;
        text-decoration: underline;
        text-decoration-skip-ink: none;
        text-underline-position: from-font;

        &:hover {
          background: transparent;
        }
      }
    }
  }
`;
