import { textBody500 } from "@databiosphere/findable-ui/lib/styles/common/mixins/fonts";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import { Card as MCard } from "@mui/material";
import { Bullets } from "../../../../../../../common/Bullets/bullets";

interface Props {
  interactionEnabled: boolean;
}

export const Grid = styled("div")<Props>`
  display: grid;
  gap: 16px;
  grid-column: 1 / -1;
  grid-template-columns: repeat(12, 80px);

  ${({ interactionEnabled }) =>
    interactionEnabled &&
    css`
      cursor: grab;
      user-select: none;

      &:active {
        cursor: grabbing;
      }
    `}
`;

export const StyledCard = styled(MCard)`
  &.MuiCard-root {
    box-shadow: 0 1px 4px 0 rgba(0, 0, 0, 0.05);
    grid-column: auto / span 3;
  }
` as typeof MCard;

export const CardSection = styled.div`
  display: grid;
  gap: 16px;
  padding: 16px;
`;

export const CardContent = styled.div`
  display: grid;
  gap: 4px;
`;

export const CardTitle = styled.span`
  ${textBody500};
`;

export const StyledCardActions = styled.div`
  display: flex;
  gap: 16px;

  .MuiLink-root {
    ${textBody500};
    color: #035c94;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;

export const StyledBullets = styled(Bullets)`
  margin-top: 24px;
`;
