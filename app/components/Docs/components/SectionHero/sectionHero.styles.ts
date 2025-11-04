import styled from "@emotion/styled";
import { SectionHero } from "../../../Layout/components/AppLayout/components/Section/components/SectionHero/sectionHero";
import {
  Head,
  SectionLayout,
} from "../../../Layout/components/AppLayout/components/Section/components/SectionHero/sectionHero.styles";
import {
  CONTENT_TYPE,
  FrontmatterProps,
} from "../../../../docs/common/frontmatter/types";
import { css } from "@emotion/react";

export const PADDING_Y_BOTTOM = 90;

export const StyledSectionHero = styled(SectionHero, {
  shouldForwardProp: (prop) => prop !== "contentType",
})<Pick<FrontmatterProps, "contentType">>`
  ${SectionLayout} {
    min-height: unset;
    padding: 56px 16px 72px;
  }

  ${(props) =>
    props.contentType === CONTENT_TYPE.ARTICLE &&
    css`
      ${SectionLayout} {
        padding: 80px 16px ${PADDING_Y_BOTTOM}px;
      }

      ${Head} {
        font-family: "Inter", sans-serif;
        font-size: 32px;
        font-weight: 500;
        letter-spacing: normal;
        line-height: 40px;
      }
    `}
`;
