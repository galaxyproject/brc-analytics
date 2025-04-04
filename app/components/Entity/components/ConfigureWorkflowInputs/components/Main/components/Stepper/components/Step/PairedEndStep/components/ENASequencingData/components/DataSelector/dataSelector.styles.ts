import { smokeLightest } from "@databiosphere/findable-ui/lib/styles/common/mixins/colors";
import styled from "@emotion/styled";
import { Paper } from "@mui/material";

export const StyledPaper = styled(Paper)`
  background-color: ${smokeLightest};
  display: grid;
  gap: 8px;
  justify-items: center;
  padding: 24px;
  text-align: center;
  width: 100%;
`;
