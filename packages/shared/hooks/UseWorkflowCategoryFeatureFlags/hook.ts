import { useFeatureFlag } from "@databiosphere/findable-ui/lib/hooks/useFeatureFlag/useFeatureFlag";
import {
  WORKFLOW_CATEGORY_FEATURE_FLAG,
  type WorkflowCategoryFeatureFlags,
} from "@repo/shared/workflow/featureFlags";

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
    [WORKFLOW_CATEGORY_FEATURE_FLAG.ASSEMBLY_WORKFLOWS]: useFeatureFlag(
      WORKFLOW_CATEGORY_FEATURE_FLAG.ASSEMBLY_WORKFLOWS
    ),
  });
