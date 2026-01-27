import { BackPageContentMainColumn } from "@databiosphere/findable-ui/lib/components/Layout/components/BackPage/backPageView.styles";
import styled from "@emotion/styled";
import { css } from "@emotion/react";

export const StyledBackPageContentMainColumn = styled(
  BackPageContentMainColumn,
  { shouldForwardProp: (prop) => prop !== "hasSidePanel" }
)<{
  hasSidePanel?: boolean;
}>`
  ${({ hasSidePanel }) =>
    hasSidePanel &&
    css`
      display: contents;
      grid-template-columns: inherit;
    `}
`;
