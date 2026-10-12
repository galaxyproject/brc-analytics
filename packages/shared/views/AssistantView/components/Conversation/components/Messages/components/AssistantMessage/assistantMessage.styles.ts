import { MarkdownRenderer } from "@databiosphere/findable-ui/lib/components/MarkdownRenderer/markdownRenderer";
import { FONT } from "@databiosphere/findable-ui/lib/styles/common/constants/font";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import styled from "@emotion/styled";

export const StyledMarkdownRenderer = styled(MarkdownRenderer)`
  color: ${PALETTE.INK_MAIN};
  font: ${FONT.BODY_400};
  overflow-wrap: break-word;

  b,
  strong {
    font-weight: 600;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    font: ${FONT.BODY_400};
    font-weight: 600;
    margin: 24px 0 8px;
  }

  hr {
    border: none;
    border-top: 1px solid ${PALETTE.SMOKE_MAIN};
    margin: 24px 0;
  }

  p {
    margin: 8px 0;
  }

  ol,
  ul {
    margin: 8px 0;
    padding-left: 20px;

    li + li {
      margin-top: 8px;
    }

    // Nested lists sit under their item, spaced as one more item.
    ol,
    ul {
      margin: 8px 0 0;
    }
  }
`;
