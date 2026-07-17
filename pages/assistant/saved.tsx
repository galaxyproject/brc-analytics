import { BRC_ROUTES } from "@/routes/constants";
import { SectionHero } from "@brc-analytics/core/components/Layout/components/AppLayout/components/Section/components/SectionHero/sectionHero";
import { StyledPagesMain } from "@brc-analytics/core/components/Layout/components/Main/main.styles";
import { useAuth } from "@brc-analytics/core/providers/authentication/provider";
import { ROUTES } from "@brc-analytics/core/routes/constants";
import { apiClient } from "@brc-analytics/core/services/api-client";
import { SavedAnalysisSummary } from "@brc-analytics/core/types/api";
import { Breadcrumb } from "@databiosphere/findable-ui/lib/components/common/Breadcrumbs/breadcrumbs";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { useRouter } from "next/router";
import { JSX, useEffect, useState } from "react";

const BREADCRUMBS: Breadcrumb[] = [
  {
    path: ROUTES.HOME,
    text: "Home",
  },
  {
    path: BRC_ROUTES.ASSISTANT,
    text: "Assistant",
  },
  {
    path: BRC_ROUTES.ASSISTANT_SAVED,
    text: "Saved Analyses",
  },
];

export default function SavedAnalysesPage(): JSX.Element {
  const {
    isAuthenticated,
    isConfigured,
    isLoading: isAuthLoading,
    login,
  } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysisSummary[]>(
    []
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !isConfigured) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- react-hooks v7 anti-pattern (setState in effect)
      setSavedAnalyses([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    apiClient
      .getSavedAnalyses()
      .then((response) => {
        if (!isMounted) return;
        setSavedAnalyses(response);
      })
      .catch((err) => {
        if (!isMounted) return;
        // Surface load failures so the empty-state copy doesn't
        // falsely claim "you have not saved any analyses yet."
        setError(
          err instanceof Error ? err.message : "Failed to load saved analyses."
        );
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return (): void => {
      isMounted = false;
    };
  }, [isAuthenticated, isConfigured]);

  async function handleDelete(id: string): Promise<void> {
    setError(null);
    try {
      await apiClient.deleteSavedAnalysis(id);
      setSavedAnalyses((current) => current.filter((item) => item.id !== id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete saved analysis."
      );
    }
  }

  async function handleRestore(id: string): Promise<void> {
    setError(null);
    try {
      const restored = await apiClient.restoreSavedAnalysis(id);
      await router.push({
        pathname: "/assistant",
        query: { sessionId: restored.session_id },
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to restore saved analysis."
      );
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
            Saved analyses are tied to your authenticated session.
          </Typography>
          <Box>
            <Button onClick={login} variant="contained">
              Sign In
            </Button>
          </Box>
        </Stack>
      );
    }

    if (error && savedAnalyses.length === 0) {
      return <Alert severity="error">{error}</Alert>;
    }

    if (savedAnalyses.length === 0) {
      return (
        <Typography variant="body1">
          You have not saved any assistant analyses yet.
        </Typography>
      );
    }

    return (
      <Stack spacing={2}>
        {error && <Alert severity="error">{error}</Alert>}
        {savedAnalyses.map((savedAnalysis) => (
          <Box
            key={savedAnalysis.id}
            sx={{
              border: (theme) => `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
              p: 3,
            }}
          >
            <Stack spacing={1.5}>
              <Typography component="h2" variant="h6">
                {savedAnalysis.title ?? "Saved analysis"}
              </Typography>
              <Typography color="text.secondary" variant="body2">
                Saved {new Date(savedAnalysis.updated_at).toLocaleString()}
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  onClick={() => void handleRestore(savedAnalysis.id)}
                  variant="contained"
                >
                  Restore
                </Button>
                <Button
                  onClick={() => void handleDelete(savedAnalysis.id)}
                  variant="outlined"
                >
                  Delete
                </Button>
              </Stack>
            </Stack>
          </Box>
        ))}
      </Stack>
    );
  }

  return (
    <>
      <SectionHero
        breadcrumbs={BREADCRUMBS}
        head="Saved Analyses"
        subHead="Saved assistant sessions are restored into a fresh working session so the snapshot stays immutable."
      />
      <Box sx={{ maxWidth: 960, mx: "auto", px: 3, py: 6, width: "100%" }}>
        {renderContent()}
      </Box>
    </>
  );
}

SavedAnalysesPage.Main = StyledPagesMain;
