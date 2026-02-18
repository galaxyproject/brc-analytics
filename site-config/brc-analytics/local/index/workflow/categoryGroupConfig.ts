import type { CategoryGroupConfig } from "@databiosphere/findable-ui/lib/config/entities";

export const CATEGORY_CONFIG = {
  CATEGORY: { key: "category", label: "Category" },
  PLOIDY: { key: "ploidy", label: "Ploidy" },
  TAXONOMY_ID: { key: "taxonomyId", label: "Taxonomy ID" },
  WORKFLOW_NAME: { key: "workflowName", label: "Workflow" },
} as const;

export const CATEGORY_GROUP_CONFIG: CategoryGroupConfig = {
  categoryGroups: [
    {
      categoryConfigs: [
        CATEGORY_CONFIG.WORKFLOW_NAME,
        CATEGORY_CONFIG.CATEGORY,
        CATEGORY_CONFIG.PLOIDY,
        CATEGORY_CONFIG.TAXONOMY_ID,
      ],
    },
  ],
  key: "workflow",
};
