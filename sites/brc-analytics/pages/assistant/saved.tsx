import { AccountRedirect } from "@repo/shared/components/AccountRedirect/accountRedirect";
import { StyledPagesMain } from "@repo/shared/components/layout/Main/main.styles";
import { type JSX } from "react";

export default function RedirectPage(): JSX.Element {
  return (
    <AccountRedirect hash="analyses" notice="Saved analyses have moved." />
  );
}

RedirectPage.Main = StyledPagesMain;
