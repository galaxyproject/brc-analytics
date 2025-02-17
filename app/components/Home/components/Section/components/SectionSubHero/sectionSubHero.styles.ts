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
`;

export const SectionSubLayout = styled.div`
  ${sectionLayout};
  ${sectionGrid};
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
          font-size: 20px;
          font-weight: 500;
          line-height: 28px;
          margin: 0;
          padding: 8px 24px;
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
`;
