import { SectionContent } from "../../../content/content.styles";
import styled from "@emotion/styled";
import { css } from "@emotion/react";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import { FONT } from "@databiosphere/findable-ui/lib/styles/common/constants/font";

interface Props {
  offset: number;
}

const heading = ({ offset }: Props) => css`
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    &:hover {
      a {
        opacity: 1;
      }
    }
  }

  h1 {
    font: ${FONT.HEADING_LARGE};
    margin: 0 0 8px;
    scroll-margin-top: ${offset + 24}px;
  }

  h2 {
    font: ${FONT.HEADING};
    margin: 32px 0 16px;
    scroll-margin-top: ${offset + 32}px;
  }

  h3 {
    font: ${FONT.HEADING_SMALL};
    margin: 32px 0 16px;
    scroll-margin-top: ${offset + 32}px;
  }

  h4 {
    font: ${FONT.BODY_LARGE_500};
    margin: 24px 0 16px;
    scroll-margin-top: ${offset + 24}px;
  }
`;

const iframe = css`
  iframe {
    aspect-ratio: 16/ 9;
    border: none;
    display: block;
    height: auto;
    margin: 16px 0;
    width: 100%;
  }
`;

const image = css`
  img {
    border: 1px solid ${PALETTE.SMOKE_MAIN};
    border-radius: 6px;
    margin: 16px 0;
    max-width: 100%;
  }

  figure {
    figcaption {
      margin-top: 24px;
    }
    img {
      margin: 0;
    }
  }
`;

const muiAlert = css`
  .MuiAlert-root {
    margin: 24px 0;
    padding: 24px;

    .MuiAlert-icon {
      padding: 4px 0;
    }

    .MuiAlert-message {
      font: ${FONT.BODY_LARGE_400_2_LINES};
      gap: 16px;

      .MuiAlertTitle-root {
        font: ${FONT.HEADING_SMALL};
      }
    }
  }
`;

// See https://github.com/emotion-js/emotion/issues/1105.
// See https://github.com/emotion-js/emotion/releases/tag/%40emotion%2Fcache%4011.10.2.
const ignoreSsrWarning =
  "/* emotion-disable-server-rendering-unsafe-selector-warning-please-do-not-use-this-the-warning-exists-for-a-reason */";
export const StyledSectionContent = styled(SectionContent, {
  shouldForwardProp: (prop) => prop !== "offset",
})<Props>`
  margin-top: 0;
  min-width: 0;

  ${heading}
  ${iframe}
  ${image}
  ${muiAlert}

  > *:first-child:not(style) ${ignoreSsrWarning} {
    margin-top: 0;
  }
`;
