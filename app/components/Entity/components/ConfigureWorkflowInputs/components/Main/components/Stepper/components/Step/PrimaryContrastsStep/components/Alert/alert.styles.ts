import styled from "@emotion/styled";
import { Alert } from "@databiosphere/findable-ui/lib/components/common/Alert/alert";
import { FONT } from "@databiosphere/findable-ui/lib/styles/common/constants/font";
import { bpDownSm } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";

export const StyledAlert = styled(Alert)`
  &.MuiAlert-root {
    margin: 0 20px 20px;

    .MuiAlert-message {
      font: ${FONT.BODY_400_2_LINES};
    }

    ${bpDownSm} {
      margin: 0 16px 16px;
    }
  }
`;
