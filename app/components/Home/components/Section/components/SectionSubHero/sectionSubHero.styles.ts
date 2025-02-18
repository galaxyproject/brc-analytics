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
import { Grid2, Tabs } from "@mui/material";
import {
  mediaDesktopSmallDown,
  mediaTabletDown,
} from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";

export const Section = styled.section`
  background-color: ${white};
  border-top: 1px solid ${smokeMain};
  width: 100%;
`;

export const SectionLayout = styled.div`
  display: grid;
  gap: 0 16px;
  grid-template-columns: 1fr 1fr;
  padding: 72px 0 104px;

  ${mediaDesktopSmallDown} {
    gap: 48px 16px;
    grid-template-columns: repeat(12, 1fr);
  }
`;

export const SectionSubLayout = styled.div`
  ${sectionLayout};
  ${sectionGrid};
  grid-column: 1 / -1;
  grid-row: 1;
  padding: 0 16px;

  ${mediaDesktopSmallDown} {
    gap: 32px 0;
    grid-template-columns: 1fr;
  }
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

  ${mediaDesktopSmallDown} {
    grid-column: 1 / -1;
    justify-self: center;
    max-width: 506px;
    text-align: center;
  }
`;

export const StyledTabs = styled(Tabs)`
  & {
    align-self: flex-end;
    box-shadow: inset 3px 0 ${smokeMain};
    gap: 16px;
    grid-column: 1 / span 5;
    justify-self: flex-start;

    .MuiTabs-scroller {
      .MuiTabs-flexContainer {
        gap: 16px;

        .MuiTab-root {
          align-items: flex-start;
          color: ${inkLight};
          gap: 8px;
          display: grid;
          font-size: 20px;
          font-weight: 500;
          justify-content: flex-start;
          line-height: 28px;
          margin: 0 0 0 24px;
          max-width: unset;
          padding: 8px 0;
          text-align: left;

          &.Mui-selected {
            color: ${inkMain};
          }
        }
      }
    }

    .MuiTabs-indicator {
      border-radius: 0;
      left: 0;
      width: 3px;
    }

    ${mediaDesktopSmallDown} {
      align-self: unset;
      box-shadow: none;
      grid-column: 1 / -1;
      justify-self: unset;

      .MuiTabs-scroller {
        .MuiTabs-flexContainer {
          gap: 0;

          .MuiTab-root {
            box-shadow: inset 0 -3px ${smokeMain};
            font-size: 18px;
            justify-content: unset;
            margin: 0;
            max-width: 360px;
            padding: 8px 24px;

            .MuiTypography-text-body-large-400 {
              display: none;
            }
          }
        }
      }

      .MuiTabs-scrollButtons {
        &[direction="left"] {
          background: linear-gradient(90deg, #ffffff 5.88%, #ffffff00 94.12%);
        }

        &[direction="right"] {
          background: linear-gradient(270deg, #ffffff 5.88%, #ffffff00 94.12%);
        }
      }
    }
  }
`;

export const StyledGrid2 = styled(Grid2)`
  display: grid;
  grid-column: 2;
  grid-row: 1;

  img {
    height: auto;
    width: 100%;
  }

  .MuiButton-root {
    align-self: flex-end;
    justify-self: flex-start;
    margin: 24px;
  }

  ${mediaDesktopSmallDown} {
    grid-column: 4 / -1;
    grid-row: 2;
  }

  ${mediaTabletDown} {
    grid-column: 2 / -1;
  }
`;
