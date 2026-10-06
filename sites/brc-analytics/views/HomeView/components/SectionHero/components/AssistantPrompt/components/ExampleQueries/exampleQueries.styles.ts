import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import styled from "@emotion/styled";
import { Chip, MenuItem } from "@mui/material";

export const StyledExampleQueries = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
`;

export const StyledChip = styled(Chip)`
  && {
    background-color: ${PALETTE.COMMON_WHITE};
    border-color: ${PALETTE.SMOKE_MAIN};
    border-radius: 999px;
    color: ${PALETTE.INK_MAIN};
    height: unset;
    padding: 7px 6px 7px 12px;
    transition: border-color 150ms ease;

    &:hover,
    &[aria-expanded="true"] {
      background-color: ${PALETTE.COMMON_WHITE};
      border-color: ${PALETTE.SMOKE_DARK};
    }

    &:active {
      box-shadow: none;
    }

    &.Mui-focusVisible {
      background-color: ${PALETTE.COMMON_WHITE};
      outline: 2px solid ${PALETTE.PRIMARY_MAIN};
      outline-offset: 2px;
    }

    .MuiChip-label {
      align-items: center;
      display: flex;
      padding: 0;
    }

    &[aria-expanded="true"] .MuiSvgIcon-root {
      transform: rotate(180deg);
    }
  }
` as typeof Chip;

/* Items are <button>s, which shrink to their text unlike list items. */
export const StyledMenuItem = styled(MenuItem)`
  text-align: left;
  white-space: normal;
  width: 100%;
` as typeof MenuItem;
