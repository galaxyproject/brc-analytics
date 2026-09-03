import { useFeatureFlag } from "@databiosphere/findable-ui/lib/hooks/useFeatureFlag/useFeatureFlag";
import { FEATURE_FLAGS } from "@repo/shared/config/featureFlags";
import type { WorkflowCategoryFeatureFlags } from "@repo/shared/workflow/featureFlags";

/**
 * Resolves the current user's enabled state for every feature flag that gates a
 * workflow category — the single place flag state is read, so the gating rule
 * itself stays owned by `filterFlagGatedWorkflowCategories`. The returned
 * record is exhaustive, so adding a category-gating flag is a compile error
 * here until it is resolved.
 * @returns Enabled state of every category-gating feature flag.
 */
export const useWorkflowCategoryFeatureFlags =
  (): WorkflowCategoryFeatureFlags => ({
    [FEATURE_FLAGS.ASSEMBLY_WORKFLOWS]: useFeatureFlag(
      FEATURE_FLAGS.ASSEMBLY_WORKFLOWS
    ),
  });
