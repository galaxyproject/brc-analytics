import { Alert, Button } from "@mui/material";
import { useGalaxyAccount } from "@repo/shared/hooks/useGalaxyAccount";
import { type JSX } from "react";

/**
 * One-time Galaxy account linking prompt. Shown when the user is signed in
 * but Galaxy has not yet linked their identity (first browser OIDC login
 * into Galaxy creates the link); the SSO session makes the hop silent.
 * @returns The connect prompt, or null when there is nothing to connect.
 */
export const ConnectGalaxyAccount = (): JSX.Element | null => {
  const { error, galaxyLoginUrl, isLinked, refresh } = useGalaxyAccount();
  if (error) {
    return (
      <Alert
        action={
          <Button
            color="inherit"
            onClick={(): void => void refresh()}
            size="small"
          >
            Retry
          </Button>
        }
        severity="warning"
      >
        {error}
      </Alert>
    );
  }
  if (isLinked !== false || !galaxyLoginUrl) return null;
  return (
    <Alert
      action={
        <>
          <Button
            color="inherit"
            href={galaxyLoginUrl}
            rel="noopener"
            size="small"
            target="_blank"
          >
            Connect Galaxy account
          </Button>
          <Button
            color="inherit"
            onClick={(): void => void refresh()}
            size="small"
          >
            I&apos;ve connected
          </Button>
        </>
      }
      severity="info"
    >
      You&apos;re signed in, but your Galaxy account isn&apos;t linked yet.
      Connect once and your searches will run in your own Galaxy account.
    </Alert>
  );
};
