import styled from "@emotion/styled";
import { StepContent } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepContent/stepContent";

export const StyledStepContent = styled(StepContent)`
  && {
    .MuiCollapse-wrapperInner.MuiCollapse-vertical {
      > .MuiGrid-root {
        gap: 0;
        padding: 0;

        > .MuiTypography-root {
          padding: 20px;
        }

        > .MuiAlert-root {
          margin: 20px 20px 4px;
        }

        > .MuiButton-root {
          margin: 20px;
        }
      }
    }
  }
`;
