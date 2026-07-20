import { UseConfiguredSteps } from "@/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/steps/types";
import { buildSteps } from "@/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/steps/utils";
import type { Workflow } from "@brc-analytics/core/apis/workflow";
import { useMemo } from "react";
import { enableReferenceAssemblyStep } from "./utils";

export const useConfiguredSteps = (workflow: Workflow): UseConfiguredSteps => {
  const configuredSteps = useMemo(
    () => enableReferenceAssemblyStep(buildSteps(workflow)),
    [workflow]
  );

  return { configuredSteps };
};
