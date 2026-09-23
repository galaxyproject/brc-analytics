import { Alert, CircularProgress, Stack, Typography } from "@mui/material";
import { useUserResource } from "@repo/shared/hooks/UseUserResource/hook";
import { useAuth } from "@repo/shared/providers/authentication/provider";
import { ENTITY_TYPE } from "@repo/shared/providers/favorites/constants";
import { useFavorites } from "@repo/shared/providers/favorites/provider";
import { apiClient } from "@repo/shared/services/api-client/api-client";
import type {
  SavedAnalysisSummary,
  WorkflowRunResponse,
} from "@repo/shared/services/api-client/types";
import { type JSX, useEffect, useState } from "react";
import { AnalysesSection } from "./components/AnalysesSection/analysesSection";
import { EmptyWorkspace } from "./components/EmptyWorkspace/emptyWorkspace";
import { FavoritesSection } from "./components/FavoritesSection/favoritesSection";
import { LaunchesSection } from "./components/LaunchesSection/launchesSection";
import { SignInGate } from "./components/SignInGate/signInGate";

// Module-level so their identity is stable: useUserResource refetches whenever
// its fetcher changes, and an inline arrow would refetch on every render.
const fetchAnalyses = (): Promise<SavedAnalysisSummary[]> =>
  apiClient.getSavedAnalyses();
const fetchLaunches = (): Promise<WorkflowRunResponse[]> =>
  apiClient.getWorkflowRuns();

/**
 * The signed-in user's workspace: analyses, saved assemblies and organisms,
 * and workflow launches.
 * @returns the workspace element.
 */
export function AccountView(): JSX.Element {
  const { user } = useAuth();
  const {
    error: favoritesError,
    favorites,
    isLoading: isFavoritesLoading,
  } = useFavorites();
  const analyses = useUserResource<SavedAnalysisSummary>(fetchAnalyses);
  const launches = useUserResource<WorkflowRunResponse>(fetchLaunches);

  const isLoading =
    isFavoritesLoading || analyses.isLoading || launches.isLoading;
  // A load that failed leaves its list empty, which is not evidence the user
  // has nothing saved -- fall through to the sections so the one that failed
  // shows its own error instead of the workspace claiming emptiness.
  const hasError = Boolean(favoritesError || analyses.error || launches.error);
  const isEmpty =
    !hasError &&
    favorites.length === 0 &&
    analyses.items.length === 0 &&
    launches.items.length === 0;

  // Sticky once true: whether to show sections or EmptyWorkspace can't be
  // decided until the first load resolves, and re-checking on every later
  // loading blip (a reload, a retry) would flash the workspace between the
  // two -- once we've resolved once, the sections themselves own their own
  // per-resource loading state.
  const [hasResolvedOnce, setHasResolvedOnce] = useState(false);
  useEffect(() => {
    if (!isLoading) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- react-hooks v7 anti-pattern (setState in effect)
      setHasResolvedOnce(true);
    }
  }, [isLoading]);

  // The three retired routes redirect to /account#analyses, #assemblies and
  // #launches, and the browser scrolls to a hash the moment it lands -- while
  // this page is still a spinner and none of those ids exist yet. Mounting the
  // sections later does not re-trigger that scroll, so without this every old
  // deep link quietly arrives at the top of the workspace.
  useEffect(() => {
    if (!hasResolvedOnce) return;
    const id = window.location.hash.slice(1);
    if (!id) return;
    document.getElementById(id)?.scrollIntoView();
  }, [hasResolvedOnce]);

  /**
   * The workspace body: a single loading state until the first load
   * resolves, then either the getting-started panel or the four sections.
   * @returns the workspace body element.
   */
  function renderContent(): JSX.Element {
    if (!hasResolvedOnce) {
      return (
        <Stack alignItems="center" py={4}>
          <CircularProgress aria-label="Loading your workspace" size={32} />
        </Stack>
      );
    }
    if (isEmpty) return <EmptyWorkspace />;
    return (
      <>
        <AnalysesSection resource={analyses} />
        {/* Both FavoritesSection instances share one fetch, so a failure is
            one failure -- show it once here rather than once per section
            (which read the same error from the shared context). Grouped with
            the sections it describes in a tighter Stack so it reads as part
            of that content, not as its own wide-gapped section. */}
        {favoritesError ? (
          <Stack spacing={2}>
            <Alert severity="error">{favoritesError.message}</Alert>
            <FavoritesSection entityType={ENTITY_TYPE.ASSEMBLY} />
            <FavoritesSection entityType={ENTITY_TYPE.ORGANISM} />
          </Stack>
        ) : (
          <>
            <FavoritesSection entityType={ENTITY_TYPE.ASSEMBLY} />
            <FavoritesSection entityType={ENTITY_TYPE.ORGANISM} />
          </>
        )}
        <LaunchesSection resource={launches} />
      </>
    );
  }

  return (
    <SignInGate message="Your workspace is tied to your BRC Analytics account.">
      <Stack spacing={5}>
        {user && (
          <Stack spacing={0.5}>
            <Typography variant="h4">
              {user.name || user.preferred_username || "Your workspace"}
            </Typography>
            {user.email && (
              <Typography color="text.secondary" variant="body2">
                {user.email}
              </Typography>
            )}
          </Stack>
        )}
        {renderContent()}
      </Stack>
    </SignInGate>
  );
}
