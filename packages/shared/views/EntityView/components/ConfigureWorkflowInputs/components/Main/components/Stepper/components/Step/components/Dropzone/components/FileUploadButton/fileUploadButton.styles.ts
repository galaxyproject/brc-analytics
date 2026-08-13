import styled from "@emotion/styled";
import { ButtonBase } from "@mui/material";

export const StyledButtonBase = styled(ButtonBase)`
  cursor: pointer;
  display: grid;
  gap: 16px;
  justify-items: center;
  padding: 24px;
  width: 100%;

  .MuiStack-root {
    min-width: 0;
    width: 100%;
  }

  .MuiSvgIcon-root {
    font-size: 72px;
  }
`;
