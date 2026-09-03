import { useFeatureFlag } from "@databiosphere/findable-ui/lib/hooks/useFeatureFlag/useFeatureFlag";
import { FEATURE_FLAGS } from "@repo/shared/config/featureFlags";
import {
  bindWorkflowFeatureFlags,
  type WorkflowGates,
} from "@repo/shared/workflow/featureFlags";
import { useMemo } from "react";

/**
 * Resolves the current user's state for every feature flag gating workflow
 * content and returns the gating rules bound to it — the single place workflow
 * flag state is read, so views ask "may this be shown" instead of carrying
 * their own copy of the rule.
 *
 * The resolved record is exhaustive, so adding a gate is a compile error here
 * until it is resolved; views take the bound rules rather than loose booleans,
 * so none of them can be called with a gate left unanswered.
 * @returns The gating rules, bound to the user's flag state.
 */
export function useWorkflowFeatureFlags(): WorkflowGates {
  const isAssemblyWorkflowsEnabled = useFeatureFlag(
    FEATURE_FLAGS.ASSEMBLY_WORKFLOWS
  );
  const isHyphyEnabled = useFeatureFlag(FEATURE_FLAGS.HYPHY);
  const isLmlsEnabled = useFeatureFlag(FEATURE_FLAGS.LMLS);
  // Memoized so the bound rules keep a stable identity across renders, and
  // callers can use them as a dependency without recomputing every render.
  return useMemo(
    () =>
      bindWorkflowFeatureFlags({
        [FEATURE_FLAGS.ASSEMBLY_WORKFLOWS]: isAssemblyWorkflowsEnabled,
        [FEATURE_FLAGS.HYPHY]: isHyphyEnabled,
        [FEATURE_FLAGS.LMLS]: isLmlsEnabled,
      }),
    [isAssemblyWorkflowsEnabled, isHyphyEnabled, isLmlsEnabled]
  );
}
