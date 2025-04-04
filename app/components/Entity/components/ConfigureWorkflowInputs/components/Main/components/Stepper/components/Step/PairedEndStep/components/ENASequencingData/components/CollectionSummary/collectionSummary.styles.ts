import styled from "@emotion/styled";
import { RoundedPaper } from "@databiosphere/findable-ui/lib/components/common/Paper/paper.styles";
import { white } from "@databiosphere/findable-ui/lib/styles/common/mixins/colors";

export const StyledPaper = styled(RoundedPaper)`
  width: 100%;

  .MuiToolbar-table {
    background-color: ${white};
    display: flex;
    gap: 8px;
    justify-content: space-between;
    padding: 16px;
  }
`;
