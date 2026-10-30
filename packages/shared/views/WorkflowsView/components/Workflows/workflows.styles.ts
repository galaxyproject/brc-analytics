import { RoundedPaper } from "@databiosphere/findable-ui/lib/components/common/Paper/components/RoundedPaper/roundedPaper";
import { bpDownSm } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import styled from "@emotion/styled";
import { Container, Stack } from "@mui/material";

export const StyledContainer = styled(Container)`
  & {
    align-content: flex-start;
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    flex: 1;
    gap: 16px;
    padding: 24px;

    ${bpDownSm} {
      padding: 16px;
    }
  }
`;

export const StyledStack = styled(Stack)`
  flex-direction: row;
  grid-column: 1 / -1;
  justify-content: space-between;
`;

export const StyledRoundedPaper = styled(RoundedPaper)`
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: 16px;
  grid-column: 1 / -1;
  padding: 40px;
`;
