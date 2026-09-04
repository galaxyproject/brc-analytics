import styled from "@emotion/styled";
import { Box } from "@mui/material";

export const StyledCard = styled(Box)`
  border: 1px solid ${({ theme }) => theme.palette.divider};
  border-radius: 8px;
  padding: 20px 24px;
`;
