import { SortingState, VisibilityState } from "@tanstack/react-table";
import { CATEGORY_CONFIGS } from "./categoryConfigs";

export const COLUMN_VISIBILITY: VisibilityState = {
  [CATEGORY_CONFIGS.LINEAGE_TAXONOMY_IDS.key]: false,
};

export const SORTING: SortingState = [
  {
    desc: false,
    id: CATEGORY_CONFIGS.TAXONOMIC_LEVEL_SPECIES.key,
  },
];
