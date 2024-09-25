import { ButtonPrimary } from "@databiosphere/findable-ui/lib/components/common/Button/components/ButtonPrimary/buttonPrimary";
import {
  CardContent as DXCardContent,
  CardSection as DXCardSection,
} from "@databiosphere/findable-ui/lib/components/common/Card/card.styles";
import { mediaTabletUp } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import { css } from "@emotion/react";
import styled from "@emotion/styled";

const boxShadow = css`
  box-shadow: 0 1px 0 0 rgba(0, 0, 0, 0.08), 0 -1px 0 0 rgba(0, 0, 0, 0.2) inset;
`;

export const StyledCardSection = styled(DXCardSection)`
  padding: 16px;

  ${mediaTabletUp} {
    padding: 16px;
  }
`;

export const StyledCardContent = styled(DXCardContent)`
  gap: 4px;
`;

export const StyledButtonPrimary = styled(ButtonPrimary)`
  background-color: #1f1f47;
  ${boxShadow};
  justify-self: flex-start;

  &:hover {
    background-color: #1f1f47;
    ${boxShadow};
  }

  &:active {
    background-color: #1f1f47;
    box-shadow: none;
  }

  &.Mui-disabled {
    background-color: #1f1f47;
    ${boxShadow};
  }
`;
