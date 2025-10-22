import {
  ContentGrid,
  OutlineGrid,
  Positioner,
} from "@databiosphere/findable-ui/lib/components/Layout/components/ContentLayout/contentLayout.styles";
import { bpUp1366 } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import styled from "@emotion/styled";
import { sectionLayout } from "../../../Layout/components/AppLayout/components/Section/section.styles";
import { ContentLayout } from "@databiosphere/findable-ui/lib/components/Layout/components/ContentLayout/contentLayout.styles";

export const StyledContentLayout = styled(ContentLayout)`
  ${bpUp1366} {
    grid-template-areas: "content";
    grid-template-columns: 1fr;
  }

  ${({ theme }) => theme.breakpoints.up(1728)} {
    grid-template-areas: "navigation content outline";
    grid-template-columns: 280px 1fr 280px;
  }
`;

export const StyledContentGrid = styled(ContentGrid)`
  ${sectionLayout}
  display: grid;
  padding: 64px 16px;
  width: 100%;
`;

export const StyledOutlineGrid = styled(OutlineGrid)`
  padding: 64px 0;

  ${bpUp1366} {
    display: none;
  }

  ${({ theme }) => theme.breakpoints.up(1728)} {
    display: block;
  }
`;

export const StyledPositioner = styled(Positioner)`
  max-height: ${({ headerHeight }) => `calc(100vh - ${headerHeight}px)`};
  padding-top: 0;
  top: ${({ headerHeight }) => `${headerHeight}px`};
`;
