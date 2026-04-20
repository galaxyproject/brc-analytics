import { Box, Button, Stack, Typography } from "@mui/material";
import { Breadcrumb } from "@databiosphere/findable-ui/lib/components/common/Breadcrumbs/breadcrumbs";
import { JSX } from "react";
import { SectionHero } from "../../app/components/Layout/components/AppLayout/components/Section/components/SectionHero/sectionHero";
import { useAuth } from "../../app/providers/authentication";

const BREADCRUMBS: Breadcrumb[] = [
  {
    path: "/",
    text: "Home",
  },
  {
    path: "/assistant",
    text: "Assistant",
  },
  {
    path: "/assistant/saved",
    text: "Saved Analyses",
  },
];

export default function SavedAnalysesPage(): JSX.Element {
  const { isAuthenticated, isConfigured, isLoading, login } = useAuth();

  return (
    <>
      <SectionHero
        breadcrumbs={BREADCRUMBS}
        head="Saved Analyses"
        subHead="Persistent assistant snapshots will appear here once the snapshot and restore flow is wired in."
      />
      <Box sx={{ maxWidth: 960, mx: "auto", px: 3, py: 6, width: "100%" }}>
        <Stack spacing={2}>
          <Typography variant="body1">
            This route is intentionally present before the saved-analyses
            feature is complete so the authenticated account menu has a stable
            destination.
          </Typography>
          {isConfigured && !isLoading && !isAuthenticated && (
            <Box>
              <Button onClick={login} variant="contained">
                Sign In
              </Button>
            </Box>
          )}
        </Stack>
      </Box>
    </>
  );
}
