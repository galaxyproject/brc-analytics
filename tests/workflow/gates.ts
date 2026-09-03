import { FEATURE_FLAGS } from "@repo/shared/config/featureFlags";
import {
  bindWorkflowFeatureFlags,
  type WorkflowFeatureFlags,
  type WorkflowGates,
} from "@repo/shared/workflow/featureFlags";

/**
 * Every workflow-gating feature flag, disabled. Exhaustive by construction, so
 * adding a gate is a compile error here — the one place the test suite has to
 * decide what a new gate defaults to.
 */
const ALL_DISABLED: WorkflowFeatureFlags = {
  [FEATURE_FLAGS.ASSEMBLY_WORKFLOWS]: false,
  [FEATURE_FLAGS.HYPHY]: false,
  [FEATURE_FLAGS.LMLS]: false,
};

/**
 * Builds a complete flag state for a test, with every flag disabled unless the
 * test names it.
 * @param featureFlags - Flags to enable for this test.
 * @returns Enabled state of every workflow-gating feature flag.
 */
export function buildWorkflowFeatureFlags(
  featureFlags: Partial<WorkflowFeatureFlags> = {}
): WorkflowFeatureFlags {
  return { ...ALL_DISABLED, ...featureFlags };
}

/**
 * Builds workflow gating rules for a test, with every flag disabled unless the
 * test names it.
 * @param featureFlags - Flags to enable for this test.
 * @returns Gating rules bound to the given flag state.
 */
export function buildWorkflowGates(
  featureFlags: Partial<WorkflowFeatureFlags> = {}
): WorkflowGates {
  return bindWorkflowFeatureFlags(buildWorkflowFeatureFlags(featureFlags));
}
