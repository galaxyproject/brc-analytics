import { useMemo } from "react";
import { Workflow } from "../../../apis/catalog/brc-analytics-catalog/common/entities";
import { UseConfiguredSteps } from "../../../components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/steps/types";
import { buildSteps } from "../../../components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/steps/utils";
import { enableReferenceAssemblyStep } from "./utils";

export const useConfiguredSteps = (workflow: Workflow): UseConfiguredSteps => {
  const configuredSteps = useMemo(
    () => enableReferenceAssemblyStep(buildSteps(workflow)),
    [workflow]
  );

  return { configuredSteps };
};
