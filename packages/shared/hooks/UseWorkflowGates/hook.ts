import { useFeatureFlag } from "@databiosphere/findable-ui/lib/hooks/useFeatureFlag/useFeatureFlag";
import { FEATURE_FLAGS } from "@repo/shared/config/featureFlags";
import {
  bindWorkflowGates,
  type WorkflowGates,
} from "@repo/shared/workflow/gates";

/**
 * Resolves the current user's state for the feature flag gating workflow
 * content and returns the gating rules bound to it — the single place workflow
 * flag state is read, so views ask "may this be shown" instead of carrying
 * their own copy of the rule.
 *
 * Views take the bound rules rather than loose booleans, so none of them can
 * apply the flag state to only half of what it gates. The rules are one of two
 * stable objects, so callers can use them as a dependency directly.
 * @returns The gating rules, bound to the user's flag state.
 */
export function useWorkflowGates(): WorkflowGates {
  return bindWorkflowGates(useFeatureFlag(FEATURE_FLAGS.DEMO));
}
