import { BackPageContentMainColumn } from "@databiosphere/findable-ui/lib/components/Layout/components/BackPage/backPageView.styles";
import { css } from "@emotion/react";
import styled from "@emotion/styled";

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
