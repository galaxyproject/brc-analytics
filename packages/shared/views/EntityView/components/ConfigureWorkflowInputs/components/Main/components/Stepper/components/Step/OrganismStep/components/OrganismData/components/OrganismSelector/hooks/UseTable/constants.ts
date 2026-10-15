import { FILTER_SORT } from "@databiosphere/findable-ui/lib/common/filters/sort/config/types";
import { type InitialTableState } from "@tanstack/react-table";
import { CATEGORY_CONFIGS } from "./categoryConfigs";
import { CATEGORY_GROUPS } from "./categoryGroups";
import { renderSummary } from "./utils";

export const INITIAL_STATE: InitialTableState = {
  sorting: [
    {
      desc: false,
      id: CATEGORY_CONFIGS.TAXONOMIC_LEVEL_SPECIES.key,
    },
  ],
};

export const META = {
  categoryGroups: CATEGORY_GROUPS,
  filterSort: FILTER_SORT.COUNT,
  summaryFn: renderSummary,
};
