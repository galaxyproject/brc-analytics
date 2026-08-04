import { StepContent } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepContent/stepContent";
import styled from "@emotion/styled";

export const StyledStepContent = styled(StepContent)`
  && {
    .MuiCollapse-wrapperInner.MuiCollapse-vertical {
      > .MuiGrid-root {
        gap: 0;
        padding: 0;
      }
    }
  }
`;
