import styled from "@emotion/styled";
import { Button } from "@mui/material";

// Clickable, pill-shaped user chip (avatar + name + caret) that anchors the
// account menu. Reads as a grouped control rather than loose text next to a
// button, and visually separates the account from the nav links.
export const UserChip = styled(Button)`
  background-color: rgba(0, 0, 0, 0.04);
  border-radius: 9999px;
  gap: 6px;
  min-width: 0;
  padding: 4px 10px 4px 4px;
  text-transform: none;

  &:hover {
    background-color: rgba(0, 0, 0, 0.08);
  }

  .MuiButton-startIcon,
  .MuiButton-endIcon {
    margin: 0;
  }
`;

export const UserMenuHeader = styled.div`
  display: flex;
  flex-direction: column;
  padding: 8px 16px;
`;
