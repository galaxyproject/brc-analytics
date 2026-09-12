import { AccountRedirect } from "@repo/shared/components/AccountRedirect/accountRedirect";
import { StyledPagesMain } from "@repo/shared/components/layout/Main/main.styles";
import { type JSX } from "react";

export default function RedirectPage(): JSX.Element {
  return <AccountRedirect notice="The preferences page has been removed." />;
}

RedirectPage.Main = StyledPagesMain;
