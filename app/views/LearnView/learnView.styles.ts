import styled from "@emotion/styled";
import { bpDownSm } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import { Stack } from "@mui/material";

export const StyledStack = styled(Stack)`
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(2, 1fr);

  ${bpDownSm} {
    grid-template-columns: 1fr;
  }
`;
