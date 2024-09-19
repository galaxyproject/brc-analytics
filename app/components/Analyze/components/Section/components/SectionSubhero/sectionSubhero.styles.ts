import { mediaDesktopSmallUp } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import styled from "@emotion/styled";
import {
  sectionGrid,
  sectionLayout,
} from "../../../../../Layout/components/AppLayout/components/Section/section.styles";

export const SectionLayout = styled.div`
  ${sectionLayout};
  ${sectionGrid};
  gap: 32px 16px;
  padding: 64px 16px;
`;

export const VideoContainer = styled.div`
  grid-column: 1 / -1;

  iframe {
    aspect-ratio: 16 / 9;
  }

  ${mediaDesktopSmallUp} {
    grid-column: 1 / span 7;
  }
`;

export const SubHeadline = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  grid-column: 1 / -1;
  grid-row: 1;

  ${mediaDesktopSmallUp} {
    grid-column: 8 / -1;
    margin-left: 48px;
  }
`;

export const Subhead = styled.h2`
  font-family: "Inter Tight", sans-serif;
  font-size: 32px;
  font-weight: 500;
  line-height: 40px;
  margin: 0;
`;
