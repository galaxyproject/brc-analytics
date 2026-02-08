import styled from "@emotion/styled";
import {
  sectionGrid,
  sectionLayout,
} from "../../../../../Layout/components/AppLayout/components/Section/section.styles";
import { Accordion, Box, Button, Grid } from "@mui/material";
import { bpDownSm } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import { FONT } from "@databiosphere/findable-ui/lib/styles/common/constants/font";

export const Section = styled.section`
  background-color: ${PALETTE.COMMON_WHITE};
  width: 100%;
`;

export const SectionLayout = styled.div`
  display: grid;
  gap: 48px 16px;
  grid-template-columns: 1fr 1fr;
  padding: 80px 0 104px;

  ${bpDownSm} {
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

  ${bpDownSm} {
    grid-column: 1 / span all;
    padding-top: 0;
  }
`;

export const AccordionBox = styled.div`
  align-self: flex-end;
  box-shadow: inset 3px 0 ${PALETTE.SMOKE_MAIN};
  display: flex;
  flex-direction: column;
  gap: 16px;
  grid-column: 1 / span 5;
  justify-self: flex-start;

  ${bpDownSm} {
    grid-column: 1 / -1;
  }
`;

export const StyledAccordion = styled(Accordion)`
  && {
    box-shadow: none;
  }

  color: ${PALETTE.INK_LIGHT};
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
    color: ${PALETTE.INK_LIGHT};
    font: ${FONT.BODY_LARGE_400};
    margin-bottom: 8px;
    padding: 0;
  }

  &.Mui-expanded {
    color: ${PALETTE.INK_MAIN};

    &::before {
      background-color: ${PALETTE.INK_MAIN};
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

export const StyledGrid = styled(Grid)`
  display: grid;
  grid-column: 2;
  grid-row: 1;
  overflow: hidden;
  padding: 0;

  ${bpDownSm} {
    grid-column: 1 / -1;
    grid-row: 2;
    grid-template-columns: 1fr;
    padding: 0 16px;
  }
`;

export const SmokeLightestBox = styled.div`
  background-color: ${PALETTE.SMOKE_LIGHTEST};
  border-radius: 16px;
  display: grid;
  grid-column: 1;
  grid-row: 1;
  height: 628px;
  overflow: hidden;
  padding: 56px 0 0 56px;
  width: 768px; // max width 712px + 56px padding

  ${bpDownSm} {
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
