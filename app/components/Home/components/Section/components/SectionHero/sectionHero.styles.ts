import {
  mediaDesktopSmallUp,
  mediaTabletUp,
} from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import {
  inkLight,
  smokeLightest,
} from "@databiosphere/findable-ui/lib/styles/common/mixins/colors";
import { textBodyLarge400 } from "@databiosphere/findable-ui/lib/styles/common/mixins/fonts";
import styled from "@emotion/styled";
import {
  section,
  sectionGrid,
  sectionLayout,
} from "../../../../../Layout/components/AppLayout/components/Section/section.styles";

export const Section = styled.section`
  ${section};
  background-color: ${smokeLightest};
  overflow: hidden;
  position: relative; /* positions svg */
  z-index: 0; /* section content above svg */
`;

export const SectionLayout = styled.div`
  ${sectionLayout};
  ${sectionGrid};
  align-content: flex-end;
  min-height: 400px;
  padding: 56px 16px;
`;

export const Headline = styled.div`
  grid-column: 1 / -1;

  ${mediaDesktopSmallUp} {
    grid-column: 1 / 8;
  }
`;

export const Head = styled.h1`
  font-family: "Inter Tight", sans-serif;
  font-size: 64px;
  font-weight: 500;
  letter-spacing: -0.4px;
  line-height: 72px;
  margin: 0;

  ${mediaTabletUp} {
    span {
      display: block;
    }
  }
`;

export const SubHeadline = styled.div`
  grid-column: 1 / -1;

  ${mediaDesktopSmallUp} {
    grid-column: 8 / -1;
    justify-self: flex-end;
  }
`;

export const SubHeadlinePositioner = styled.div`
  display: grid;
  gap: 20px;
  max-width: 392px;

  .MuiButton-root {
    justify-self: flex-start;
  }
`;

export const Subhead = styled.h2`
  ${textBodyLarge400};
  color: ${inkLight};
  margin: 0;

  span {
    display: block;
    margin: 8px 0;

    &:first-of-type {
      margin-top: 0;
    }

    &:last-of-type {
      margin-bottom: 0;
    }
  }
`;
