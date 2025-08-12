import { bpUpSm } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
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
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import { FONT } from "@databiosphere/findable-ui/lib/styles/common/constants/font";

export interface LayoutProps {
  centered?: boolean;
  paired?: boolean;
}

export interface SectionProps {
  border?: boolean;
  divider?: boolean;
}

export const list = css`
  ol,
  ul {
    margin: 0;
    padding-left: 24px;
  }

  ol + p,
  ul + p {
    margin-top: 16px;
  }

  ol ol {
    list-style-type: lower-roman;
  }
`;

export const listItem = css`
  li {
    margin: 4px 0;

    &:last-child {
      margin-bottom: 0;
    }
  }
`;

export const Section = styled.section<SectionProps>`
  ${({ border }) =>
    border &&
    css`
      ${sectionSubHero};
    `}

  ${({ divider }) =>
    divider &&
    css`
      ${sectionWithDivider};
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
      ${bpUpSm(props)} {
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

      ${bpUpSm(props)} {
        grid-area: feature;
      }
    `}
`;

export const SubHeadline = styled.div`
  color: ${PALETTE.INK_LIGHT};
  font: ${FONT.BODY_LARGE_400};

  ${SectionHeadline} & {
    margin-top: 16px;
  }
`;

export const SectionContent = styled.div<LayoutProps>`
  ${list};
  ${listItem};
  grid-column: 1 / -1;
  margin-top: 16px;

  ${(props) =>
    props.paired &&
    css`
      ${bpUpSm(props)} {
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
