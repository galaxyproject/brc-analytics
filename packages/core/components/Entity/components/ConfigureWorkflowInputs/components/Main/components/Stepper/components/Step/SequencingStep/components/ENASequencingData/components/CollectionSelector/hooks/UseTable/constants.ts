import { SortingState, VisibilityState } from "@tanstack/react-table";
import { CATEGORY_CONFIGS } from "./categoryConfigs";

export const COLUMN_VISIBILITY: VisibilityState = { tax_id: false };

export const SORTING: SortingState = [
  {
    desc: true,
    id: CATEGORY_CONFIGS.FIRST_CREATED.key,
  },
];
