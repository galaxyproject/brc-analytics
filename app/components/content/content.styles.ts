import { mediaTabletUp } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import { inkLight } from "@databiosphere/findable-ui/lib/styles/common/mixins/colors";
import { textBodyLarge400 } from "@databiosphere/findable-ui/lib/styles/common/mixins/fonts";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import {
  headline,
  sectionGrid,
  sectionGridAreas,
  sectionLayout,
  sectionSubHero,
  sectionWithDivider,
} from "../Layout/components/AppLayout/components/Section/section.styles";

export interface LayoutProps {
  centered?: boolean;
  paired?: boolean;
}

export interface SectionProps {
  border?: boolean;
  divider?: boolean;
}

export const Section = styled.section<SectionProps>`
  ${(props) =>
    props.border &&
    css`
      ${sectionSubHero(props)};
    `}

  ${(props) =>
    props.divider &&
    css`
      ${sectionWithDivider(props)};
    `}
`;

export const SectionLayout = styled.div<LayoutProps>`
  ${sectionLayout};
  ${sectionGrid};
  gap: 0 16px;
  padding: 64px 16px;

  ${(props) =>
    props.paired &&
    css`
      ${mediaTabletUp(props)} {
        ${sectionGridAreas};
      }
    `}
`;

export const SectionHeadline = styled.div<LayoutProps>`
  ${headline};
  ${(props) =>
    props.centered &&
    css`
      grid-column: 4 / -4;
      text-align: center;
    `}
  ${(props) =>
    props.paired &&
    css`
      grid-column: 1 / -1;
      max-width: 504px;

      ${mediaTabletUp(props)} {
        grid-area: feature;
      }
    `}
`;

export const SubHeadline = styled.div`
  ${textBodyLarge400};
  color: ${inkLight};

  ${SectionHeadline} & {
    margin-top: 16px;
  }
`;

export const SectionContent = styled.div<LayoutProps>`
  grid-column: 1 / -1;
  margin-top: 16px;

  ${(props) =>
    props.paired &&
    css`
      ${mediaTabletUp(props)} {
        grid-area: detail;
        margin-top: 0;
      }
    `}
  ${(props) =>
    props.centered &&
    css`
      margin-top: 40px;
    `}
  > *:last-child {
    margin-bottom: 0;
  }
`;
