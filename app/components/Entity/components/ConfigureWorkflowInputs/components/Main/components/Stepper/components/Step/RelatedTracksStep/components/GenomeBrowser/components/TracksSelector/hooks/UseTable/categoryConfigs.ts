import { CategoryConfig } from "@databiosphere/findable-ui/lib/common/categories/config/types";

export const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  GROUP_ID: { key: "groupId", label: "Group ID" },
  LONG_LABEL: { key: "longLabel", label: "Track Type" },
} as const;
