import { ColumnFiltersState } from "@tanstack/react-table";
import { useMemo } from "react";
import { Workflow } from "../../../../../../../../../../../../../../../../../apis/catalog/brc-analytics-catalog/common/entities";
import { StepProps } from "../../../../../../../types";
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
