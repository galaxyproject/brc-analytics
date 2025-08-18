import { SortingState } from "@tanstack/react-table";
import { CATEGORY_CONFIGS } from "./categoryConfigs";

export const SORTING: SortingState = [
  {
    desc: true,
    id: CATEGORY_CONFIGS.FIRST_PUBLIC.key,
  },
];
