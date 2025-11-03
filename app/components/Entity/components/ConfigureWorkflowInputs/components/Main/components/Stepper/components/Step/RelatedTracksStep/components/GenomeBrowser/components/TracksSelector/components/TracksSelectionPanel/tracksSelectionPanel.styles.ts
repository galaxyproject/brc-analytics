import styled from "@emotion/styled";
import { Container, Stack } from "@mui/material";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import { css } from "@emotion/react";
import { FONT } from "@databiosphere/findable-ui/lib/styles/common/constants/font";
import { RoundedPaper } from "@databiosphere/findable-ui/lib/components/common/Paper/paper.styles";

interface Props {
  canExpand?: boolean;
  isExpanded?: boolean;
  isGrouped?: boolean;
  isLastRow?: boolean;
  isSelected?: boolean;
  isSubRow?: boolean;
}

export const StyledStack = styled(Stack)`
  padding: 24px;
`;

export const StyledRoundedPaper = styled(RoundedPaper)`
  && {
    overflow: hidden;
  }
`;

export const StyledContainer = styled(Container, {
  shouldForwardProp: (prop) =>
    prop !== "canExpand" &&
    prop !== "isExpanded" &&
    prop !== "isGrouped" &&
    prop !== "isLastRow" &&
    prop !== "isSelected" &&
    prop !== "isSubRow",
})<Props>`
  && {
    align-items: center;
    background-color: ${PALETTE.COMMON_WHITE};
    box-shadow: 0 0 0 1px ${PALETTE.SMOKE_MAIN};
    display: flex;
    font: ${FONT.BODY_400};
    gap: 8px;
    padding: 14px 16px;
    transition: background-color 300ms ease-in;

    > span {
      display: flex;
    }

    ${({ canExpand, isExpanded }) =>
      canExpand &&
      css`
        background-color: ${PALETTE.SMOKE_LIGHTEST};
        cursor: pointer;

        .MuiSvgIcon-root {
          transition: transform 0.2s ease-in-out;
        }

        ${isExpanded &&
        css`
          .MuiSvgIcon-root {
            transform: rotate(90deg);
          }
        `}
      `}

    ${({ isSubRow }) =>
      isSubRow &&
      css`
        background-color: ${PALETTE.SMOKE_LIGHTEST};
        padding: 14px 44px;
      `}

    ${({ isLastRow }) =>
      isLastRow &&
      css`
        border-bottom-left-radius: 8px;
        border-bottom-right-radius: 8px;
      `}

    ${({ isExpanded, isGrouped }) =>
      isGrouped &&
      css`
        background-color: ${PALETTE.COMMON_WHITE};
        border-radius: 8px;
        padding: 16px;

        &:nth-of-type(n + 2) {
          margin-top: 16px;
        }

        ${isExpanded &&
        css`
          border-bottom-left-radius: 0;
          border-bottom-right-radius: 0;
        `}
      `}

    ${({ isSelected }) =>
      isSelected &&
      css`
        background-color: ${PALETTE.PRIMARY_LIGHTEST};
      `}
  }
`;
