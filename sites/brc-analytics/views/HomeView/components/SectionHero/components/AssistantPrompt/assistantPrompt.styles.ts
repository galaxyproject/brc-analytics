import { MOBILE_COLUMN_MAX_WIDTH } from "@brc/views/HomeView/components/SectionHero/constants";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import { SHADOWS } from "@databiosphere/findable-ui/lib/styles/common/constants/shadows";
import { bpDownSm } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import styled from "@emotion/styled";

export const StyledAssistantPrompt = styled.div`
  display: grid;
  gap: 16px;
  max-width: 560px;
  width: 100%;

  ${bpDownSm} {
    max-width: ${MOBILE_COLUMN_MAX_WIDTH}px;
  }
`;

export const StyledForm = styled.form`
  /* The input ships with padding around its paper, a plain icon button, and the
     field stacked above the button so the row beneath it can hold more actions.
     The input has no other actions: it renders the paper flush, the field and
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

      &:has(.MuiInputBase-root.Mui-focused) {
        box-shadow:
          inset 0 0 0 1px ${PALETTE.INK_MAIN},
          ${SHADOWS["02"]};
      }
    }

    .MuiInputBase-root {
      padding: 8px 0 8px 16px;

      input::placeholder,
      textarea::placeholder {
        color: ${PALETTE.INK_LIGHT};
        opacity: 1;
      }
    }

    /* Input renders a secondary icon button: replace its grey inset outline. */
    .MuiIconButton-root {
      background-color: ${PALETTE.PRIMARY_MAIN};
      border-radius: 4px;
      box-shadow: 0 1px 0 0 ${PALETTE.PRIMARY_DARK};
      color: ${PALETTE.COMMON_WHITE};
      padding: 6px;

      &:hover {
        background-color: ${PALETTE.PRIMARY_DARK};
      }

      &:active {
        background-color: ${PALETTE.PRIMARY_DARK};
        box-shadow: none;
      }

      &.Mui-disabled {
        background-color: ${PALETTE.PRIMARY_MAIN};
        color: ${PALETTE.COMMON_WHITE};
        opacity: 0.5;
      }
    }
  }
`;
