import { type KeyValuePairs } from "@databiosphere/findable-ui/lib/components/common/KeyValuePairs/keyValuePairs";
import type { OrganismContract } from "@repo/shared/apis/types";
import type { Workflow } from "@repo/shared/apis/workflow";
import type { StepConfig } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/types";
import type { ConfiguredInput } from "@repo/shared/views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import { type ComponentProps } from "react";

/**
 * Builds the props for the organism-details KeyValuePairs. A site can supply its
 * own builder to render site-specific details (e.g. a priority-pathogen chip).
 */
export type OrganismBuilder = (
  organism: OrganismContract
) => ComponentProps<typeof KeyValuePairs>;

export interface Props {
  configuredInput: ConfiguredInput;
  configuredSteps: StepConfig[];
  organism?: OrganismContract;
  // Optional per-site organism-details builder; defaults to the shared builder,
  // letting a site inject one that renders site-specific details without the
  // shared component depending on the site.
  organismBuilder?: OrganismBuilder;
  workflow: Workflow;
}
