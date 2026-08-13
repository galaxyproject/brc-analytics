import type { Workflow } from "@repo/shared/apis/workflow";
import { type StepProps } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/types";
import { type ColumnFiltersState } from "@tanstack/react-table";
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
