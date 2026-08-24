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
 * @returns the gated content or a sign-in prompt.
 */
export function SignInGate({ children, message }: Props): JSX.Element {
  const { isAuthenticated, isConfigured, isLoading, login } = useAuth();

  if (!isConfigured || isLoading) {
    return (
      <Stack alignItems="center" py={6}>
        <CircularProgress />
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
