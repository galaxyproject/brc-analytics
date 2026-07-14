import { useAuth } from "@/providers/authentication";
import { Button, Menu, MenuItem, Typography } from "@mui/material";
import { useRouter } from "next/router";
import { JSX, MouseEvent, useState } from "react";
import { AuthButtonWrapper } from "./authButton.styles";

/**
 * Header auth button — shows Sign In or user name + Sign Out.
 * @returns auth button element, or null while loading.
 */
export function AuthButton(): JSX.Element | null {
  const { isAuthenticated, isConfigured, isLoading, login, logout, user } =
    useAuth();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  if (!isConfigured || isLoading) return null;

  if (!isAuthenticated) {
    return (
      <Button color="primary" onClick={login} size="small" variant="outlined">
        Sign In
      </Button>
    );
  }

  const isMenuOpen = !!anchorEl;

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
    <AuthButtonWrapper>
      <Button
        color="primary"
        onClick={handleMenuOpen}
        size="small"
        variant="text"
      >
        {user?.name}
      </Button>
      <Menu
        anchorEl={anchorEl}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        onClose={handleMenuClose}
        open={isMenuOpen}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
      >
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
        <MenuItem onClick={handleLogout}>Sign Out</MenuItem>
      </Menu>
      <Typography variant="body2">{user?.email}</Typography>
    </AuthButtonWrapper>
  );
}
