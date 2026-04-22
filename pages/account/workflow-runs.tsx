import {
  Box,
  Button,
  CircularProgress,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import { Breadcrumb } from "@databiosphere/findable-ui/lib/components/common/Breadcrumbs/breadcrumbs";
import { JSX, useEffect, useState } from "react";
import { SectionHero } from "../../app/components/Layout/components/AppLayout/components/Section/components/SectionHero/sectionHero";
import { useAuth } from "../../app/providers/authentication";
import { brcAPIClient } from "../../app/services/brc-api-client";
import { WorkflowRunResponse } from "../../app/types/api";

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

  useEffect(() => {
    if (!isAuthenticated || !isConfigured) {
      setWorkflowRuns([]);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    brcAPIClient
      .getWorkflowRuns()
      .then((response) => {
        if (!isMounted) return;
        setWorkflowRuns(response);
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
        subHead="Workflow handoffs are tracked here once they are associated with your account. Anonymous launches are still recorded in the database, but only authenticated runs are listed on this page."
      />
      <Box sx={{ maxWidth: 960, mx: "auto", px: 3, py: 6, width: "100%" }}>
        {renderContent()}
      </Box>
    </>
  );
}
