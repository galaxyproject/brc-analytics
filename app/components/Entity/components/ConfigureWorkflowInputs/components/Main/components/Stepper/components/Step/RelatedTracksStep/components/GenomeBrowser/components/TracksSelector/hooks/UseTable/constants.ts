import { GroupingState, VisibilityState } from "@tanstack/react-table";
import { CATEGORY_CONFIGS } from "./categoryConfigs";

export const COLUMN_VISIBILITY: VisibilityState = {
  [CATEGORY_CONFIGS.GROUP_ID.key]: false,
};

export const GROUPING: GroupingState = [CATEGORY_CONFIGS.GROUP_ID.key];
