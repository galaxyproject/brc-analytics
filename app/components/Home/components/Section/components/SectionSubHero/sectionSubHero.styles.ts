import {
  inkLight,
  inkMain,
  smokeMain,
  white,
} from "@databiosphere/findable-ui/lib/styles/common/mixins/colors";
import styled from "@emotion/styled";
import {
  sectionGrid,
  sectionLayout,
} from "../../../../../Layout/components/AppLayout/components/Section/section.styles";
import { Accordion, Box, Button, Grid2 } from "@mui/material";
import { mediaTabletDown } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import { smokeLightest } from "@databiosphere/findable-ui/lib/theme/common/palette";
import { textBodyLarge400 } from "@databiosphere/findable-ui/lib/styles/common/mixins/fonts";

export const Section = styled.section`
  background-color: ${white};
  border-top: 1px solid ${smokeMain};
  width: 100%;
`;

export const SectionLayout = styled.div`
  display: grid;
  gap: 48px 16px;
  grid-template-columns: 1fr 1fr;
  padding: 72px 0 104px;

  ${mediaTabletDown} {
    grid-template-columns: repeat(12, 1fr);
  }
`;

export const SectionSubLayout = styled.div`
  ${sectionLayout};
  ${sectionGrid};
  gap: 32px 0;
  grid-column: 1 / -1;
  grid-row: 1;
  padding: 0 16px;
`;

export const Subhead = styled.div`
  align-self: flex-start;
  font-family: "Inter Tight", sans-serif;
  font-size: 32px;
  font-weight: 400;
  grid-column: 1 / span 5;
  letter-spacing: normal;
  line-height: 40px;
  margin: 0;
  padding-top: 8px;

  ${mediaTabletDown} {
    grid-column: 1 / span all;
    padding-top: 0;
  }
`;

export const AccordionBox = styled.div`
  align-self: flex-end;
  box-shadow: inset 3px 0 ${smokeMain};
  display: flex;
  flex-direction: column;
  gap: 16px;
  grid-column: 1 / span 5;
  justify-self: flex-start;

  ${mediaTabletDown} {
    grid-column: 1 / -1;
  }
`;

export const StyledAccordion = styled(Accordion)`
  && {
    box-shadow: none;
  }

  color: ${inkLight};
  padding-left: 24px;

  .MuiAccordionSummary-root {
    min-height: unset;

    .MuiAccordionSummary-content {
      font-size: 20px;
      font-weight: 500;
      line-height: 28px;
      letter-spacing: normal;
      margin: 8px 0;
    }

    &.Mui-disabled {
      opacity: 1;
    }
  }

  .MuiAccordionDetails-root {
    ${textBodyLarge400};
    color: ${inkLight};
    margin-bottom: 8px;
    padding: 0;
  }

  &.Mui-expanded {
    color: ${inkMain};

    &::before {
      background-color: ${inkMain};
      content: "";
      display: block;
      height: 100%;
      opacity: 1;
      width: 3px;
    }
  }

  &.Mui-disabled {
    background-color: transparent;
  }
`;

export const StyledGrid2 = styled(Grid2)`
  display: grid;
  grid-column: 2;
  grid-row: 1;
  overflow: hidden;
  padding: 0;

  ${mediaTabletDown} {
    grid-column: 1 / -1;
    grid-row: 2;
    grid-template-columns: 1fr;
    padding: 0 16px;
  }
`;

export const SmokeLightestBox = styled.div`
  background-color: ${smokeLightest};
  border-radius: 16px;
  display: grid;
  grid-column: 1;
  grid-row: 1;
  height: 628px;
  overflow: hidden;
  padding: 56px 0 0 56px;
  width: 768px; // max width 712px + 56px padding

  ${mediaTabletDown} {
    height: unset;
    padding: 32px 0 0 32px;
    width: 100%;
  }
`;

export const StyledBox = styled(Box)`
  aspect-ratio: 1;
  background-position: top left;
  background-repeat: no-repeat;
  background-size: auto 100%;
  grid-column: 1;
  grid-row: 1;
`;

export const TransparentBox = styled.div`
  display: grid;
  grid-column: 1;
  grid-row: 1;
`;

export const StyledButton = styled(Button)`
  align-self: flex-end;
  grid-column: 1;
  grid-row: 1;
  justify-self: flex-start;
  margin: 24px;
`;
