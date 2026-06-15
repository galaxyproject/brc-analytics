import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import {
  Avatar,
  Button,
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import { JSX, MouseEvent, useState } from "react";
import { useAuth } from "../../../../../../providers/authentication";
import { UserChip, UserMenuHeader } from "./authButton.styles";

const MENU_ID = "user-account-menu";

/**
 * Build up-to-two-letter initials from a display name.
 * @param name - User display name.
 * @returns Uppercased initials, or "?" when unavailable.
 */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (parts[0][0] + last).toUpperCase();
}

/**
 * Header auth control — Sign In when logged out, or a clickable user chip that
 * opens an account menu (name, email, Sign out) when logged in.
 * @returns auth control element, or null while loading.
 */
export function AuthButton(): JSX.Element | null {
  const { isAuthenticated, isConfigured, isLoading, login, logout, user } =
    useAuth();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const isOpen = Boolean(anchorEl);

  if (!isConfigured || isLoading) return null;

  if (!isAuthenticated) {
    return (
      <Button color="primary" onClick={login} size="small" variant="outlined">
        Sign In
      </Button>
    );
  }

  const displayName = user?.name || user?.preferred_username || "Account";

  const handleOpen = (event: MouseEvent<HTMLElement>): void => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (): void => {
    setAnchorEl(null);
  };

  const handleSignOut = (): void => {
    handleClose();
    void logout();
  };

  return (
    <>
      <UserChip
        aria-controls={isOpen ? MENU_ID : undefined}
        aria-expanded={isOpen}
        aria-haspopup="true"
        color="inherit"
        endIcon={<KeyboardArrowDownRoundedIcon fontSize="small" />}
        onClick={handleOpen}
        startIcon={
          <Avatar
            sx={{
              bgcolor: "primary.main",
              fontSize: 12,
              fontWeight: 600,
              height: 28,
              lineHeight: 1,
              width: 28,
            }}
          >
            {getInitials(displayName)}
          </Avatar>
        }
        variant="text"
      >
        {displayName}
      </UserChip>
      <Menu
        anchorEl={anchorEl}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        id={MENU_ID}
        onClose={handleClose}
        open={isOpen}
        slotProps={{ paper: { sx: { minWidth: 220 } } }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
      >
        <UserMenuHeader>
          <Typography variant="subtitle2">{displayName}</Typography>
          {user?.email && (
            <Typography color="text.secondary" variant="caption">
              {user.email}
            </Typography>
          )}
        </UserMenuHeader>
        <Divider />
        <MenuItem onClick={handleSignOut}>
          <ListItemIcon>
            <LogoutRoundedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Sign out</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
