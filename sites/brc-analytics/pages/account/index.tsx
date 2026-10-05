import { type Breadcrumb } from "@databiosphere/findable-ui/lib/components/common/Breadcrumbs/breadcrumbs";
import { Box } from "@mui/material";
import { StyledPagesMain } from "@repo/shared/components/layout/Main/main.styles";
import { SectionHero } from "@repo/shared/components/layout/SectionHero/sectionHero";
import { AccountView } from "@repo/shared/views/AccountView/accountView";
import { type JSX } from "react";

const BREADCRUMBS: Breadcrumb[] = [
  { path: "/", text: "Home" },
  { path: "/account", text: "Workspace" },
];

export default function AccountPage(): JSX.Element {
  return (
    <>
      <SectionHero
        breadcrumbs={BREADCRUMBS}
        head="Your workspace"
        subHead="Assemblies you have saved, analyses you are working on, and workflows you have launched."
      />
      <Box sx={{ maxWidth: 960, mx: "auto", px: 3, py: 6, width: "100%" }}>
        <AccountView />
      </Box>
    </>
  );
}

AccountPage.Main = StyledPagesMain;
