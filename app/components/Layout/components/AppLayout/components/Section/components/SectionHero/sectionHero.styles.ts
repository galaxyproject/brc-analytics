import { mediaTabletUp } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import {
  inkLight,
  smokeLightest,
} from "@databiosphere/findable-ui/lib/styles/common/mixins/colors";
import { textBodyLarge400 } from "@databiosphere/findable-ui/lib/styles/common/mixins/fonts";
import styled from "@emotion/styled";
import { Section } from "../../../../../../../common/Section/section";
import { sectionGrid, sectionLayout } from "../../section.styles";

export const StyledSection = styled(Section)`
  background-color: ${smokeLightest};
  overflow: hidden;
  position: relative; /* positions svg */
  z-index: 0; /* section content above svg */
`;

export const SectionLayout = styled.div`
  ${sectionLayout};
  ${sectionGrid};
  align-content: flex-start;
  min-height: 152px;
  padding: 56px 16px;
`;

export const Headline = styled.div`
  align-content: flex-start;
  display: grid;
  gap: 8px;
  grid-column: 1 / -1;
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

  ${mediaTabletUp} {
    grid-column: 1 / 8;
  }
`;

export const Subhead = styled.div`
  ${textBodyLarge400};
  color: ${inkLight};
  margin: 0;

  .MuiLink-root {
    color: inherit;
    text-decoration: underline;

    &:hover {
      text-decoration: none;
    }
  }
`;
