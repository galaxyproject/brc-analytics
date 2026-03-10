import { SortingState } from "@tanstack/react-table";
import { CATEGORY_CONFIGS } from "./categoryConfigs";

export const SORTING: SortingState = [
  {
    desc: false,
    id: CATEGORY_CONFIGS.TAXONOMIC_LEVEL_SPECIES.key,
  },
];
