import styled from "@emotion/styled";
import { StepContent } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepContent/stepContent";
import { Stack } from "@mui/material";

export const StyledStepContent = styled(StepContent)`
  && {
    .MuiCollapse-wrapperInner.MuiCollapse-vertical {
      > .MuiGrid-root {
        gap: 0;
        padding: 0;

        .MuiDivider-root {
          width: 100%;
        }
      }
    }
  }
`;

export const StyledStack = styled(Stack)`
  align-items: flex-start;
  width: 100%;
`;
