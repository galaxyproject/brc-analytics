import { Button, Typography } from "@mui/material";
import { JSX } from "react";
import { useAuth } from "../../../../../../providers/authentication";
import { AuthButtonWrapper } from "./authButton.styles";

/**
 * Header auth button — shows Sign In or user name + Sign Out.
 * @returns auth button element, or null while loading.
 */
export function AuthButton(): JSX.Element | null {
  const { isAuthenticated, isLoading, login, logout, user } = useAuth();

  if (isLoading) return null;

  if (!isAuthenticated) {
    return (
      <Button color="primary" onClick={login} size="small" variant="outlined">
        Sign In
      </Button>
    );
  }

  return (
    <AuthButtonWrapper>
      <Typography variant="body2">{user?.name}</Typography>
      <Button color="primary" onClick={logout} size="small" variant="text">
        Sign Out
      </Button>
    </AuthButtonWrapper>
  );
}
