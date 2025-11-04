import {
  OutlineGrid,
  Positioner,
} from "@databiosphere/findable-ui/lib/components/Layout/components/ContentLayout/contentLayout.styles";
import {
  bpDownSm,
  bpUp1366,
} from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import styled from "@emotion/styled";
import { sectionLayout } from "../../../Layout/components/AppLayout/components/Section/section.styles";
import { ContentLayout } from "@databiosphere/findable-ui/lib/components/Layout/components/ContentLayout/contentLayout.styles";
import {
  CONTENT_TYPE,
  FrontmatterProps,
} from "../../../../docs/common/frontmatter/types";
import { css } from "@emotion/react";
import { Content } from "@databiosphere/findable-ui/lib/components/Layout/components/ContentLayout/contentLayout.styles";
import { Outline } from "@databiosphere/findable-ui/lib/components/Layout/components/ContentLayout/contentLayout.styles";

export const PADDING_Y = 64;

export const StyledContentLayout = styled(ContentLayout, {
  shouldForwardProp: (propName) => propName !== "contentType",
})<Pick<FrontmatterProps, "contentType">>`
  ${(props) =>
    props.contentType !== CONTENT_TYPE.ARTICLE &&
    css`
      ${bpUp1366(props)} {
        grid-template-areas: "content";
        grid-template-columns: 1fr;
      }

      ${props.theme.breakpoints.up(1728)} {
        grid-template-areas: "navigation content outline";
        grid-template-columns: 280px 1fr 280px;
      }
    `}
`;

export const StyledContent = styled(Content, {
  shouldForwardProp: (propName) => propName !== "contentType",
})<Pick<FrontmatterProps, "contentType">>`
  ${(props) =>
    props.contentType !== CONTENT_TYPE.ARTICLE &&
    css`
      ${sectionLayout}
      padding: ${PADDING_Y}px 16px;
    `}

  ${(props) =>
    props.contentType === CONTENT_TYPE.ARTICLE &&
    css`
      padding: ${PADDING_Y}px 40px;
    `}

    ${bpDownSm} {
    padding: ${PADDING_Y}px 16px;
  }
`;

export const StyledOutlineGrid = styled(OutlineGrid, {
  shouldForwardProp: (propName) => propName !== "contentType",
})<Pick<FrontmatterProps, "contentType">>`
  ${(props) =>
    props.contentType !== CONTENT_TYPE.ARTICLE &&
    css`
      ${bpUp1366(props)} {
        display: none;
      }

      ${props.theme.breakpoints.up(1728)} {
        display: block;
      }
    `}
`;

export const StyledPositioner = styled(Positioner)`
  top: 24px;
`;

export const StyledOutline = styled(Outline)`
  padding: ${PADDING_Y}px 0;
`;
