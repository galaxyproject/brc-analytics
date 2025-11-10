import styled from "@emotion/styled";
import { Alert } from "@databiosphere/findable-ui/lib/components/common/Alert/alert";

export const StyledAlert = styled(Alert)`
  &.MuiAlert-root {
    justify-self: stretch;

    .MuiAlert-message {
      ul {
        margin: 0;
        padding-left: 20px;

        li {
          margin: 4px 0;

          &:first-of-type {
            margin-top: 0;
          }

          &:last-of-type {
            margin-bottom: 0;
          }
        }
      }
    }
  }
`;
