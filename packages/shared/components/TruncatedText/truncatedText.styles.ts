import styled from "@emotion/styled";
import { ButtonBase } from "@mui/material";

export const StyledSpan = styled.span<{ clamp: number }>`
  display: block;

  ${({ clamp }) =>
    clamp &&
    `
    display: -webkit-box;
    -webkit-line-clamp: ${clamp};
    -webkit-box-orient: vertical;
    overflow: hidden;
  `}
`;

export const StyledButtonBase = styled(ButtonBase)`
  font: inherit;
  line-height: inherit;
  margin-left: 4px;
  text-decoration: underline;
  text-decoration-skip-ink: none;
  text-underline-position: from-font;
  vertical-align: baseline;
`;
