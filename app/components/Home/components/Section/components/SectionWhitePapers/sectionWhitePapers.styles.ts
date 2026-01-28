import { bpUpSm } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import styled from "@emotion/styled";
import { sectionLayout } from "../../../../../Layout/components/AppLayout/components/Section/section.styles";
import { Card, Divider } from "@mui/material";

export const Section = styled.section`
  background-color: ${PALETTE.COMMON_WHITE};
  border-top: 1px solid ${PALETTE.SMOKE_MAIN};
  width: 100%;
`;

export const SectionLayout = styled.div`
  ${sectionLayout};
  display: flex;
  flex-direction: column;
  gap: 48px 16px;
  padding: 64px 16px 60px;
`;

export const StyledGrid = styled.div`
  display: grid;
  gap: 48px 16px;

  ${bpUpSm} {
    grid-template-columns: repeat(2, 1fr);
  }
`;

export const StyledCard = styled(Card)`
  .MuiCardActionArea-root {
    display: flex;
    flex-direction: column;
    gap: 16px;
    text-decoration: none;

    &:hover {
      .MuiCardActionArea-focusHighlight {
        opacity: 0;
      }
    }
  }

  .MuiCardContent-root {
    align-self: flex-start;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 0;

    .MuiTypography-heading-small {
      max-width: 504px;
    }
  }
`;

export const StyledDivider = styled(Divider)`
  ${sectionLayout};
`;
