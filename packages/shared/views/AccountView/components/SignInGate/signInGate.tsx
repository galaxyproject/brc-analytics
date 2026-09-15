import {
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { useAuth } from "@repo/shared/providers/authentication/provider";
import { type JSX } from "react";
import type { Props } from "./types";

/**
 * Renders children for a signed-in user, or a sign-in prompt otherwise.
 *
 * One gate for the whole account area -- the four pages this replaces each
 * had their own wording for the same state.
 * @param props - Component props.
 * @param props.children - Content shown to a signed-in user.
 * @param props.message - Why signing in is needed.
 * @returns the gated content, a sign-in prompt, or null when login is off.
 */
export function SignInGate({ children, message }: Props): JSX.Element | null {
  const { isAuthenticated, isConfigured, isLoading, login } = useAuth();

  // Login is not enabled on this site -- a permanent state, not a loading one.
  // Combining these two into one guard is what made the pages this replaces
  // sit on a spinner forever wherever login was off.
  if (!isConfigured) return null;

  if (isLoading) {
    return (
      <Stack alignItems="center" py={6}>
        <CircularProgress aria-label="Loading" />
      </Stack>
    );
  }

  if (!isAuthenticated) {
    return (
      <Stack spacing={2}>
        <Typography variant="h5">Sign in required</Typography>
        <Typography variant="body1">{message}</Typography>
        <Box>
          <Button onClick={login} variant="contained">
            Sign In
          </Button>
        </Box>
      </Stack>
    );
  }

  return <>{children}</>;
}
