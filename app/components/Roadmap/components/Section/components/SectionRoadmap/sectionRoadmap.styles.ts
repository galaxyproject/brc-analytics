import { mediaTabletUp } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import { inkLight } from "@databiosphere/findable-ui/lib/styles/common/mixins/colors";
import {
  textBody500,
  textBodyLarge4002Lines,
  textBodyLarge500,
} from "@databiosphere/findable-ui/lib/styles/common/mixins/fonts";
import styled from "@emotion/styled";
import {
  sectionGrid,
  sectionLayout,
} from "../../../../../Layout/components/AppLayout/components/Section/section.styles";

export const SectionLayout = styled.div`
  ${sectionLayout}
  ${sectionGrid};
  padding: 96px 16px 98px;
`;

export const SubHeadline = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  grid-column: 1 / -1;

  ${mediaTabletUp} {
    grid-column: 1 / 6;
  }
`;

export const Subhead = styled.h2`
  font-size: 40px;
  font-weight: 500;
  grid-column: 1 / -1;
  letter-spacing: -0.4px;
  line-height: 48px;
  margin: 0;
`;

export const SectionContent = styled.div`
  grid-column: 1 / -1;

  ${mediaTabletUp} {
    grid-column: 7 / -1;
  }
`;

export const Category = styled.div`
  margin: 40px 0;

  &:first-of-type {
    margin-top: 0;
  }

  &:last-of-type {
    margin-bottom: 0;
  }
`;

export const CategoryTitle = styled.h4`
  ${textBodyLarge500};
  margin: 4px 0 16px;
`;

export const CategorySubTitle = styled.h3`
  ${textBody500};
`;

export const CategoryText = styled.div`
  ${textBodyLarge4002Lines};
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
