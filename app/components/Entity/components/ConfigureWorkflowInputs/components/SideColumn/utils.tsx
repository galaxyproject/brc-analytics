import { type StepConfig } from "@/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/types";
import { type ConfiguredInput } from "@/views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import { KeyElType } from "@databiosphere/findable-ui/lib/components/common/KeyValuePairs/components/KeyElType/keyElType";
import { ValueElType } from "@databiosphere/findable-ui/lib/components/common/KeyValuePairs/components/ValueElType/valueElType";
import {
  type Key,
  type KeyValuePairs,
  type Value,
} from "@databiosphere/findable-ui/lib/components/common/KeyValuePairs/keyValuePairs";
import { Stack } from "@databiosphere/findable-ui/lib/components/common/Stack/stack";
import { TypographyWordBreak } from "@databiosphere/findable-ui/lib/components/common/Typography/TypographyWordBreak/TypographyWordBreak";
import type { Workflow } from "@repo/shared/apis/workflow";
import { type ComponentProps } from "react";

export const buildWorkflowConfiguration = (
  configuredInput: ConfiguredInput,
  configuredSteps: StepConfig[]
): ComponentProps<typeof KeyValuePairs> => {
  const keyValuePairs = new Map<Key, Value>();
  for (const key of Object.keys(configuredInput)) {
    // Find the step config, for the configured input.
    const stepConfig = configuredSteps.find((step) => step.key === key);
    if (!stepConfig) continue;
    // Get the value for the configured input.
    const value = stepConfig.renderValue?.(configuredInput);
    if (value === undefined) continue;
    keyValuePairs.set(stepConfig.label, value);
  }
  // If there are no configured inputs, add a "None" value.
  if (keyValuePairs.size === 0) {
    keyValuePairs.set("", "None");
  }
  return {
    KeyElType: KeyElType,
    KeyValuesElType: (props) => <Stack {...props} gap={4} />,
    ValueElType: TypographyWordBreak,
    keyValuePairs,
  };
};

export const buildWorkflowDetails = (
  workflow: Workflow
): ComponentProps<typeof KeyValuePairs> => {
  const keyValuePairs = new Map<Key, Value>();
  keyValuePairs.set("Workflow", workflow.workflowName);
  keyValuePairs.set("Description", workflow.workflowDescription);
  return {
    KeyElType: KeyElType,
    KeyValuesElType: (props) => <Stack {...props} gap={4} />,
    ValueElType: ValueElType,
    keyValuePairs,
  };
};
