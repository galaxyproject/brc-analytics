import { useAuth } from "@brc-analytics/core/providers/authentication/provider";
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
import { useRouter } from "next/router";
import { JSX, MouseEvent, useId, useState } from "react";
import { UserChip, UserMenuHeader } from "./authButton.styles";

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
 * opens the account menu (name/email, account links, Sign out) when logged in.
 * @returns auth control element, or null while loading.
 */
export function AuthButton(): JSX.Element | null {
  const { isAuthenticated, isConfigured, isLoading, login, logout, user } =
    useAuth();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const menuButtonId = useId();
  const menuId = useId();

  if (!isConfigured || isLoading) return null;

  if (!isAuthenticated) {
    return (
      <Button color="primary" onClick={login} size="small" variant="outlined">
        Sign In
      </Button>
    );
  }

  const isMenuOpen = !!anchorEl;
  const displayName = user?.name || user?.preferred_username || "Account";

  function handleMenuOpen(event: MouseEvent<HTMLElement>): void {
    setAnchorEl(event.currentTarget);
  }

  function handleMenuClose(): void {
    setAnchorEl(null);
  }

  async function handleLogout(): Promise<void> {
    handleMenuClose();
    await logout();
  }

  async function navigateTo(path: string): Promise<void> {
    handleMenuClose();
    await router.push(path);
  }

  return (
    <>
      <UserChip
        aria-controls={isMenuOpen ? menuId : undefined}
        aria-expanded={isMenuOpen || undefined}
        aria-haspopup="menu"
        color="inherit"
        endIcon={<KeyboardArrowDownRoundedIcon fontSize="small" />}
        id={menuButtonId}
        onClick={handleMenuOpen}
        startIcon={<Avatar>{getInitials(displayName)}</Avatar>}
        variant="text"
      >
        {displayName}
      </UserChip>
      <Menu
        anchorEl={anchorEl}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        id={menuId}
        onClose={handleMenuClose}
        open={isMenuOpen}
        slotProps={{
          list: { "aria-labelledby": menuButtonId },
          paper: { sx: { minWidth: 220 } },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
      >
        <UserMenuHeader role="presentation">
          <Typography variant="subtitle2">{displayName}</Typography>
          {user?.email && (
            <Typography color="text.secondary" variant="caption">
              {user.email}
            </Typography>
          )}
        </UserMenuHeader>
        <Divider component="li" />
        <MenuItem onClick={() => navigateTo("/data/favorites")}>
          Favorites
        </MenuItem>
        <MenuItem onClick={() => navigateTo("/assistant/saved")}>
          Saved Analyses
        </MenuItem>
        <MenuItem onClick={() => navigateTo("/account/workflow-runs")}>
          Workflow Runs
        </MenuItem>
        <MenuItem onClick={() => navigateTo("/account/preferences")}>
          Preferences
        </MenuItem>
        <Divider component="li" />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutRoundedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Sign out</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
