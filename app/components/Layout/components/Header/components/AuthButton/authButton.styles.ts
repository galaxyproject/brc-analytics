import { Button, styled } from "@mui/material";

// Clickable, pill-shaped user chip (avatar + name + caret) that anchors the
// account menu. Reads as a grouped control rather than loose text next to a
// button, and visually separates the account from the nav links.
export const UserChip = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.action.hover,
  borderRadius: 9999,
  gap: "6px",
  minWidth: 0,
  padding: "4px 10px 4px 4px",
  textTransform: "none",
  "&:hover": {
    backgroundColor: theme.palette.action.selected,
  },
  ".MuiButton-startIcon, .MuiButton-endIcon": {
    margin: 0,
  },
}));

export const UserMenuHeader = styled("div")({
  display: "flex",
  flexDirection: "column",
  padding: "8px 16px",
});
