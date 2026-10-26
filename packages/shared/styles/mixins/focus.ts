import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import { css } from "@emotion/react";

/**
 * Focus ring for an element that isn't a control but takes focus, such as a
 * region keyboard users scroll or a row focus is moved to, shown when focus
 * comes from the keyboard.
 */
export const focusVisibleOutline = css`
  &:focus-visible {
    outline: 2px solid ${PALETTE.PRIMARY_MAIN};
    outline-offset: 2px;
  }
`;
