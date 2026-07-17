import { BRC_ROUTES } from "@/routes/constants";
import { Assembly } from "@/views/WorkflowInputsView/types";
import { sanitizeEntityId } from "@brc-analytics/core/apis/utils";
import { useAssemblyFavorites } from "@brc-analytics/core/components/Favorites/hooks/UseAssemblyFavorites/hook";
import { SectionHero } from "@brc-analytics/core/components/Layout/components/AppLayout/components/Section/components/SectionHero/sectionHero";
import { StyledPagesMain } from "@brc-analytics/core/components/Layout/components/Main/main.styles";
import { useAuth } from "@brc-analytics/core/providers/authentication/provider";
import { ROUTES } from "@brc-analytics/core/routes/constants";
import { getEntity } from "@brc-analytics/core/services/workflows/query";
import { Breadcrumb } from "@databiosphere/findable-ui/lib/components/common/Breadcrumbs/breadcrumbs";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { JSX } from "react";

const BREADCRUMBS: Breadcrumb[] = [
  {
    path: ROUTES.HOME,
    text: "Home",
  },
  {
    path: BRC_ROUTES.FAVORITES,
    text: "Favorites",
  },
];

export default function FavoritesPage(): JSX.Element {
  const {
    isAuthenticated,
    isConfigured,
    isLoading: isAuthLoading,
    login,
  } = useAuth();
  const { error, favorites, isLoading } = useAssemblyFavorites();

  function getAssembly(accession: string): Assembly | null {
    try {
      return getEntity<Assembly>("assemblies", sanitizeEntityId(accession));
    } catch {
      return null;
    }
  }

  function renderContent(): JSX.Element {
    if (!isConfigured || isAuthLoading || isLoading) {
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
          <Typography variant="body1">
            Favorites are stored per account.
          </Typography>
          <Box>
            <Button onClick={login} variant="contained">
              Sign In
            </Button>
          </Box>
        </Stack>
      );
    }

    if (error) {
      return (
        <Alert severity="error">
          Failed to load favorites: {error.message}
        </Alert>
      );
    }

    if (favorites.length === 0) {
      return (
        <Typography variant="body1">
          You have not saved any assemblies yet.
        </Typography>
      );
    }

    return (
      <Stack spacing={2}>
        {favorites.map((favorite) => {
          const assembly = getAssembly(favorite.entity_id);
          const href = `/data/assemblies/${sanitizeEntityId(favorite.entity_id)}`;

          return (
            <Box
              key={`${favorite.entity_type}:${favorite.entity_id}`}
              sx={{
                border: (theme) => `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                p: 3,
              }}
            >
              <Stack spacing={1}>
                <Typography component="h2" variant="h6">
                  {assembly?.accession ?? favorite.entity_id}
                </Typography>
                <Box>
                  <Button LinkComponent={Link} href={href} variant="outlined">
                    Open Assembly
                  </Button>
                </Box>
              </Stack>
            </Box>
          );
        })}
      </Stack>
    );
  }

  return (
    <>
      <SectionHero
        breadcrumbs={BREADCRUMBS}
        head="Favorites"
        subHead="Saved assemblies follow your authenticated account and stay available across visits."
      />
      <Box sx={{ maxWidth: 960, mx: "auto", px: 3, py: 6, width: "100%" }}>
        {renderContent()}
      </Box>
    </>
  );
}

FavoritesPage.Main = StyledPagesMain;
