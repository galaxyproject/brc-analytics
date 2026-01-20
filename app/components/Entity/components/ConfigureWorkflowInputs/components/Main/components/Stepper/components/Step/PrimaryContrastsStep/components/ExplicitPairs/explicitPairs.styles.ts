import styled from "@emotion/styled";
import { Stack } from "@mui/material";
import { bpDownSm } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";

export const StyledStack = styled(Stack)`
  padding: 20px;
  padding-top: 0;
  width: 100%;

  .MuiButton-root {
    align-self: flex-start;
  }

  ${bpDownSm} {
    padding: 20px 16px;
    padding-top: 0;
  }
`;
