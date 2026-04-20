import {
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { Breadcrumb } from "@databiosphere/findable-ui/lib/components/common/Breadcrumbs/breadcrumbs";
import { useRouter } from "next/router";
import { JSX, useEffect, useState } from "react";
import { SectionHero } from "../../app/components/Layout/components/AppLayout/components/Section/components/SectionHero/sectionHero";
import { useAuth } from "../../app/providers/authentication";
import { brcAPIClient } from "../../app/services/brc-api-client";
import { SavedAnalysisSummary } from "../../app/types/api";

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

  useEffect(() => {
    if (!isAuthenticated || !isConfigured) {
      setSavedAnalyses([]);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    brcAPIClient
      .getSavedAnalyses()
      .then((response) => {
        if (!isMounted) return;
        setSavedAnalyses(response);
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
    await brcAPIClient.deleteSavedAnalysis(id);
    setSavedAnalyses((current) => current.filter((item) => item.id !== id));
  }

  async function handleRestore(id: string): Promise<void> {
    const restored = await brcAPIClient.restoreSavedAnalysis(id);
    await router.push({
      pathname: "/assistant",
      query: {
        savedAnalysisId: id,
        sessionId: restored.session_id,
      },
    });
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

    if (savedAnalyses.length === 0) {
      return (
        <Typography variant="body1">
          You have not saved any assistant analyses yet.
        </Typography>
      );
    }

    return (
      <Stack spacing={2}>
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
