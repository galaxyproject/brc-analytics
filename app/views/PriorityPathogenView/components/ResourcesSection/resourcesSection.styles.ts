import { textBody4002Lines } from "@databiosphere/findable-ui/lib/styles/common/mixins/fonts";
import styled from "@emotion/styled";
import { List } from "@mui/material";

export const StyledList = styled(List)`
  ${textBody4002Lines};
  list-style-type: disc;
  padding-left: 24px;

  .MuiListItem-root {
    display: list-item;
    margin: 4px 0;

    &:first-of-type {
      margin-top: 0;
    }

    &:last-of-type {
      margin-bottom: 0;
    }
  }
`;
