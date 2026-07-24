import { StepProps } from "@/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/types";
import type { Workflow } from "@repo/shared/apis/workflow";
import { ColumnFiltersState } from "@tanstack/react-table";
import { useMemo } from "react";
import { preSelectColumnFilters } from "./utils";

export const useColumnFilters = (
  workflow: Workflow,
  stepKey: StepProps["stepKey"]
): ColumnFiltersState => {
  return useMemo(
    () => preSelectColumnFilters(workflow, stepKey),
    [stepKey, workflow]
  );
};
