import styled from "@emotion/styled";
import { Button } from "@mui/material";

export const StyledButton = styled(Button)`
  align-self: flex-start;
  padding: 6px 0;
  text-transform: none;

  .MuiButton-startIcon {
    margin: 0;
  }

  &:hover {
    text-decoration: none;
  }
`;
