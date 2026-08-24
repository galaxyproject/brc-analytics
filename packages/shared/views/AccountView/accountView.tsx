import { Stack, Typography } from "@mui/material";
import { useUserResource } from "@repo/shared/hooks/UseUserResource/hook";
import { useAuth } from "@repo/shared/providers/authentication/provider";
import { ENTITY_TYPE } from "@repo/shared/providers/favorites/constants";
import { useFavorites } from "@repo/shared/providers/favorites/provider";
import { apiClient } from "@repo/shared/services/api-client/api-client";
import type {
  SavedAnalysisSummary,
  WorkflowRunResponse,
} from "@repo/shared/services/api-client/types";
import { type JSX } from "react";
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
        {!isLoading && isEmpty ? (
          <EmptyWorkspace />
        ) : (
          <>
            <AnalysesSection resource={analyses} />
            <FavoritesSection entityType={ENTITY_TYPE.ASSEMBLY} />
            <FavoritesSection entityType={ENTITY_TYPE.ORGANISM} />
            <LaunchesSection resource={launches} />
          </>
        )}
      </Stack>
    </SignInGate>
  );
}
