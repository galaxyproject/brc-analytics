import styled from "@emotion/styled";
import { Stack } from "@mui/material";
import { focusVisibleOutline } from "@repo/shared/styles/mixins/focus";

export const StyledStack = styled(Stack)`
  align-items: center;
  gap: 8px;
  justify-content: space-between;
  padding: 6px 0;

  ${focusVisibleOutline}
`;
