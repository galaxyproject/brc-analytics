import { Button, styled } from "@mui/material";

// Clickable, pill-shaped user chip (avatar + name + caret) that anchors the
// account menu. Reads as a grouped control rather than loose text next to a
// button, and visually separates the account from the nav links.
export const UserChip = styled(Button)(({ theme }) => ({
  "&:hover": {
    backgroundColor: theme.palette.action.selected,
  },
  // The avatar is the Button's startIcon, whose default rule
  // (.MuiButton-startIcon > :nth-of-type(1)) forces a 20px font on its child and
  // ties a plain .MuiAvatar-root override on specificity. Scope to the startIcon
  // context so the initials actually shrink to fit the 28px circle.
  ".MuiButton-startIcon .MuiAvatar-root": {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    fontSize: 12,
    fontWeight: 600,
    height: 28,
    width: 28,
  },
  ".MuiButton-startIcon, .MuiButton-endIcon": {
    margin: 0,
  },
  backgroundColor: theme.palette.action.hover,
  borderRadius: 9999,
  gap: "6px",
  minWidth: 0,
  padding: "4px 10px 4px 4px",
  textTransform: "none",
}));

export const UserMenuHeader = styled("div")({
  display: "flex",
  flexDirection: "column",
  padding: "8px 16px",
});
