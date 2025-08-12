import styled from "@emotion/styled";
import { List } from "@mui/material";
import { FONT } from "@databiosphere/findable-ui/lib/styles/common/constants/font";

export const StyledList = styled(List)`
  font: ${FONT.BODY_400_2_LINES};
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
