import { StyledPagesMain } from "@repo/shared/components/layout/Main/main.styles";
import { useRouter } from "next/router";
import { type JSX, useEffect } from "react";

export default function RedirectPage(): JSX.Element {
  const router = useRouter();

  useEffect(() => {
    // A transition the visitor interrupts rejects here; there is nothing to
    // recover, so swallow it rather than leave an unhandled rejection.
    router.replace("/account#analyses").catch(() => undefined);
  }, [router]);

  return <></>;
}

RedirectPage.Main = StyledPagesMain;
