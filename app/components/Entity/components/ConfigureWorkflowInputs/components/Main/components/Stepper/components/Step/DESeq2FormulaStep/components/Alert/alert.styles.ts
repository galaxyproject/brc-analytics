import styled from "@emotion/styled";
import { Alert } from "@databiosphere/findable-ui/lib/components/common/Alert/alert";
import { FONT } from "@databiosphere/findable-ui/lib/styles/common/constants/font";

export const StyledAlert = styled(Alert)`
  &.MuiAlert-root {
    width: 100%;

    .MuiAlert-message {
      font: ${FONT.BODY_400_2_LINES};
    }
  }
`;
