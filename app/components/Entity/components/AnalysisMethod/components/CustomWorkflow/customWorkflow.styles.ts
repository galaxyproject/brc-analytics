import styled from "@emotion/styled";
import { StyledAccordion as BaseStyledAccordion } from "../../analysisMethod.styles";

export const StyledAccordion = styled(BaseStyledAccordion)`
  && {
    padding: 4px 0;

    .MuiAccordion-heading {
      padding: 16px 20px;
    }

    .MuiAccordionDetails-root {
      padding: 0 20px 16px 20px;
    }
  }
` as typeof BaseStyledAccordion;
