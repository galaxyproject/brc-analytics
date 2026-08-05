import type { Workflow } from "@repo/shared/apis/workflow";
import { type UseConfiguredSteps } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/steps/types";
import { buildSteps } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/steps/utils";
import { useMemo } from "react";
import { enableReferenceAssemblyStep } from "./utils";

export const useConfiguredSteps = (workflow: Workflow): UseConfiguredSteps => {
  const configuredSteps = useMemo(
    () => enableReferenceAssemblyStep(buildSteps(workflow)),
    [workflow]
  );

  return { configuredSteps };
};
