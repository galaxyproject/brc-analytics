import { RoundedPaper } from "@databiosphere/findable-ui/lib/components/common/Paper/components/RoundedPaper/roundedPaper";
import styled from "@emotion/styled";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import { css } from "@emotion/react";

export const StyledRoundedPaper = styled(RoundedPaper)<{ error?: boolean }>`
  align-items: center;
  border-radius: 4px;
  display: flex;
  gap: 16px;
  padding: 16px;
  width: 100%;

  .MuiSvgIcon-root {
    color: ${PALETTE.INK_LIGHT};
  }

  ${(props) =>
    props.error &&
    css`
      background-color: ${PALETTE.ALERT_LIGHTEST};
      border-color: ${PALETTE.ALERT_MAIN};

      .MuiSvgIcon-colorError {
        color: ${PALETTE.ALERT_MAIN};
      }

      ul {
        color: ${PALETTE.ALERT_MAIN};
        list-style-position: outside;
        margin: 0;
        padding-left: 18px;

        li {
          padding: 4px 0;

          &:first-of-type {
            padding-top: 0;
          }

          &:last-of-type {
            padding-bottom: 0;
          }
        }
      }
    `}
`;
