import { Typography } from "@mui/material";
import { AppLink } from "@repo/shared/components/AppLink/appLink";
import { useRouter } from "next/router";
import { type JSX, useEffect } from "react";
import type { Props } from "./types";

/**
 * Sends a retired account route to the workspace that replaced it.
 *
 * The site is a static export, so this is a client-side redirect rather than
 * anything the server could answer -- which is what makes the fallback below
 * worth rendering.
 * @param props - Component props.
 * @param props.hash - Workspace section to land on; omit for the top.
 * @param props.notice - One sentence saying what happened to this page.
 * @returns the fallback element, seen only if the redirect never runs.
 */
export function AccountRedirect({ hash, notice }: Props): JSX.Element {
  const router = useRouter();
  const href = hash ? `/account#${hash}` : "/account";

  useEffect(() => {
    // A transition the visitor interrupts rejects here; there is nothing to
    // recover, so swallow it rather than leave an unhandled rejection.
    router.replace(href).catch(() => undefined);
  }, [href, router]);

  // The redirect above is instant in normal use -- this covers a failed
  // navigation, or a visitor with JS disabled who never runs it, either of
  // which would otherwise leave a blank page with no way forward.
  return (
    <Typography variant="body1">
      {notice} Go to your <AppLink href={href}>account workspace</AppLink>.
    </Typography>
  );
}
