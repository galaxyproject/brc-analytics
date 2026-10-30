import { FILTER_SORT } from "@databiosphere/findable-ui/lib/common/filters/sort/config/types";
import { CATEGORY_GROUPS } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/ReferenceAssemblyStep/components/AssemblyData/components/AssemblySelector/hooks/UseTable/categoryGroups";
import {
  COLUMN_VISIBILITY,
  SORTING,
} from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/ReferenceAssemblyStep/components/AssemblyData/components/AssemblySelector/hooks/UseTable/constants";
import { renderSummary } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/ReferenceAssemblyStep/components/AssemblyData/components/AssemblySelector/hooks/UseTable/utils";
import { type InitialTableState } from "@tanstack/react-table";
import { type Assembly } from "./types";

export const INITIAL_STATE: InitialTableState = {
  columnVisibility: COLUMN_VISIBILITY,
  sorting: SORTING,
};

export const META = {
  categoryGroups: CATEGORY_GROUPS,
  filterSort: FILTER_SORT.COUNT,
  summaryFn: renderSummary,
};

/**
 * Stable empty table data, for when no organism is resolved yet.
 */
export const NO_ASSEMBLIES: Assembly[] = [];
