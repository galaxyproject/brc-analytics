import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import { SHADOWS } from "@databiosphere/findable-ui/lib/styles/common/constants/shadows";
import styled from "@emotion/styled";

export const StyledForm = styled.form`
  max-width: 560px;
  width: 100%;

  /* The input ships with padding around its paper and a plain icon button;
     the hero renders the paper flush and the send action as a primary button. */
  && {
    .MuiBox-root {
      padding: 0;
    }

    .MuiPaper-root {
      border-color: ${PALETTE.SMOKE_DARK};
      box-shadow: ${SHADOWS["02"]};
    }

    .MuiIconButton-root {
      background-color: ${PALETTE.PRIMARY_MAIN};
      border-radius: 4px;
      color: ${PALETTE.COMMON_WHITE};
      padding: 6px;

      &:hover {
        background-color: ${PALETTE.PRIMARY_DARK};
      }

      &.Mui-disabled {
        background-color: ${PALETTE.PRIMARY_MAIN};
        color: ${PALETTE.COMMON_WHITE};
        opacity: 0.5;
      }
    }
  }
`;
