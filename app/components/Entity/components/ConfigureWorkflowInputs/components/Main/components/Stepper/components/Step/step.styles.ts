import { Stack } from "@mui/material";
import styled from "@emotion/styled";
import { bpDownSm } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";

export const StyledStack = styled(Stack)`
  align-items: flex-start;
  padding: 20px;
  width: 100%;

  ${bpDownSm} {
    padding: 20px 16px;
  }
`;
