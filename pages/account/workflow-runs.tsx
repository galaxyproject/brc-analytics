import { SectionHero } from "@/components/Layout/components/AppLayout/components/Section/components/SectionHero/sectionHero";
import { useAuth } from "@/providers/authentication";
import { brcAPIClient } from "@/services/brc-api-client";
import { WorkflowRunResponse } from "@/types/api";
import { Breadcrumb } from "@databiosphere/findable-ui/lib/components/common/Breadcrumbs/breadcrumbs";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import { JSX, useEffect, useState } from "react";

const BREADCRUMBS: Breadcrumb[] = [
  {
    path: "/",
    text: "Home",
  },
  {
    path: "/account/workflow-runs",
    text: "Workflow Runs",
  },
];

export default function WorkflowRunsPage(): JSX.Element {
  const {
    isAuthenticated,
    isConfigured,
    isLoading: isAuthLoading,
    login,
  } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [workflowRuns, setWorkflowRuns] = useState<WorkflowRunResponse[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !isConfigured) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- react-hooks v7 anti-pattern (setState in effect)
      setWorkflowRuns([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    brcAPIClient
      .getWorkflowRuns()
      .then((response) => {
        if (!isMounted) return;
        setWorkflowRuns(response);
      })
      .catch((err) => {
        if (!isMounted) return;
        // Surface load failures so the empty-state copy doesn't
        // falsely claim there are no runs.
        setError(
          err instanceof Error ? err.message : "Failed to load workflow runs."
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
            Workflow run history is attached to your authenticated BRC Analytics
            account when available.
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
      return <Alert severity="error">{error}</Alert>;
    }

    if (workflowRuns.length === 0) {
      return (
        <Typography variant="body1">
          You have not launched any tracked workflow handoffs yet.
        </Typography>
      );
    }

    return (
      <Stack spacing={2}>
        {workflowRuns.map((workflowRun) => (
          <Box
            key={workflowRun.id}
            sx={{
              border: (theme) => `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
              p: 3,
            }}
          >
            <Stack spacing={1}>
              <Typography component="h2" variant="h6">
                {workflowRun.workflow_trs_id}
              </Typography>
              {workflowRun.assembly_accession && (
                <Typography color="text.secondary" variant="body2">
                  Assembly: {workflowRun.assembly_accession}
                </Typography>
              )}
              <Typography color="text.secondary" variant="body2">
                Source: {workflowRun.launch_source}
              </Typography>
              <Typography color="text.secondary" variant="body2">
                Status: {workflowRun.status}
              </Typography>
              <Typography color="text.secondary" variant="body2">
                Tracked {new Date(workflowRun.created_at).toLocaleString()}
              </Typography>
              <Box>
                <Link
                  href={workflowRun.handoff_url}
                  rel="noreferrer"
                  target="_blank"
                  underline="hover"
                >
                  Open Galaxy Handoff URL
                </Link>
              </Box>
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
        head="Workflow Runs"
        subHead="Workflow handoffs are tracked here once they are associated with your account. Anonymous launches are still recorded, but only authenticated runs are listed on this page."
      />
      <Box sx={{ maxWidth: 960, mx: "auto", px: 3, py: 6, width: "100%" }}>
        {renderContent()}
      </Box>
    </>
  );
}
