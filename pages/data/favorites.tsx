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
    path: "/data/favorites",
    text: "Favorites",
  },
];

export default function FavoritesPage(): JSX.Element {
  const { isAuthenticated, isConfigured, isLoading, login } = useAuth();

  return (
    <>
      <SectionHero
        breadcrumbs={BREADCRUMBS}
        head="Favorites"
        subHead="Saved assemblies will appear here once the favorites flow is wired in."
      />
      <Box sx={{ maxWidth: 960, mx: "auto", px: 3, py: 6, width: "100%" }}>
        <Stack spacing={2}>
          <Typography variant="body1">
            This route is in place so account navigation is stable while the
            favorites implementation lands in the next slice.
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
