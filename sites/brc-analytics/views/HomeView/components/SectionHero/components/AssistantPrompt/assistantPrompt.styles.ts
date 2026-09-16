import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import { SHADOWS } from "@databiosphere/findable-ui/lib/styles/common/constants/shadows";
import { bpDownSm } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import styled from "@emotion/styled";

export const StyledForm = styled.form`
  max-width: 560px;
  width: 100%;

  /* The input ships with padding around its paper, a plain icon button, and the
     field stacked above the button so the row beneath it can hold more actions.
     The hero has no other actions: it renders the paper flush, the field and
     the send action on a single row, and the send action as a primary button. */
  && {
    .MuiBox-root {
      padding: 0;
    }

    .MuiPaper-root {
      align-items: center;
      border: none;
      box-shadow:
        inset 0 0 0 1px ${PALETTE.SMOKE_DARK},
        ${SHADOWS["02"]};
      flex-direction: row;
    }

    .MuiInputBase-root {
      padding: 8px 0 8px 16px;

      input::placeholder,
      textarea::placeholder {
        color: ${PALETTE.INK_LIGHT};
        opacity: 1;
      }
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

  ${bpDownSm} {
    /* Deliberately wider than the headline column so the box can hold
       ASSISTANT_INPUT_PLACEHOLDER on one line, and capped so it stays tied to
       it. That placeholder renders at 356px and the field padding and send
       button take another 64px, needing 420px, rounded up to 424px.
       The cap only decides the width once the viewport can afford it, from
       around 456px up; below that the viewport is the narrower constraint and
       the placeholder wraps to two lines. Re-measure if its wording changes. */
    max-width: 424px;
  }
`;
