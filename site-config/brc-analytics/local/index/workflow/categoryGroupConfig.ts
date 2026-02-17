import type { CategoryGroupConfig } from "@databiosphere/findable-ui/lib/config/entities";

export const CATEGORY_CONFIG = {
  CATEGORY: { key: "category", label: "Category" },
  WORKFLOW_NAME: { key: "workflowName", label: "Workflow" },
} as const;

export const CATEGORY_GROUP_CONFIG: CategoryGroupConfig = {
  categoryGroups: [
    {
      categoryConfigs: [
        CATEGORY_CONFIG.WORKFLOW_NAME,
        CATEGORY_CONFIG.CATEGORY,
      ],
    },
  ],
  key: "workflow",
};
