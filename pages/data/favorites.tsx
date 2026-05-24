import { Breadcrumb } from "@databiosphere/findable-ui/lib/components/common/Breadcrumbs/breadcrumbs";
import {
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { JSX } from "react";
import { sanitizeEntityId } from "../../app/apis/catalog/common/utils";
import { SectionHero } from "../../app/components/Layout/components/AppLayout/components/Section/components/SectionHero/sectionHero";
import { useAssemblyFavorites } from "../../app/hooks/useAssemblyFavorites";
import { useAuth } from "../../app/providers/authentication";
import { getEntity } from "../../app/services/workflows/query";
import { Assembly } from "../../app/views/WorkflowInputsView/types";

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
  const {
    isAuthenticated,
    isConfigured,
    isLoading: isAuthLoading,
    login,
  } = useAuth();
  const { favorites, isLoading } = useAssemblyFavorites();

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
