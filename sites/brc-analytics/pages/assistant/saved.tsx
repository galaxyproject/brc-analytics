import { Typography } from "@mui/material";
import { AppLink } from "@repo/shared/components/AppLink/appLink";
import { StyledPagesMain } from "@repo/shared/components/layout/Main/main.styles";
import { useRouter } from "next/router";
import { type JSX, useEffect } from "react";

const ACCOUNT_HREF = "/account#analyses";

export default function RedirectPage(): JSX.Element {
  const router = useRouter();

  useEffect(() => {
    // A transition the visitor interrupts rejects here; there is nothing to
    // recover, so swallow it rather than leave an unhandled rejection.
    router.replace(ACCOUNT_HREF).catch(() => undefined);
  }, [router]);

  // The redirect above is instant in normal use -- this covers a failed
  // navigation, or a visitor with JS disabled who never runs it, either of
  // which would otherwise leave a blank page with no way forward.
  return (
    <Typography variant="body1">
      Saved analyses have moved. Go to your{" "}
      <AppLink href={ACCOUNT_HREF}>account workspace</AppLink>.
    </Typography>
  );
}

RedirectPage.Main = StyledPagesMain;
