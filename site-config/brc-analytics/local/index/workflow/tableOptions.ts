import { SORT_DIRECTION } from "@databiosphere/findable-ui/lib/config/entities";
import { TableOptions } from "@tanstack/react-table";
import { CATEGORY_CONFIG } from "./categoryGroupConfig";
import { WorkflowEntity } from "./types";

export const TABLE_OPTIONS: Omit<
  TableOptions<WorkflowEntity>,
  "columns" | "data" | "getCoreRowModel"
> = {
  initialState: {
    columnVisibility: {
      [CATEGORY_CONFIG.CATEGORY.key]: false,
      [CATEGORY_CONFIG.COMMON_NAME.key]: false,
      [CATEGORY_CONFIG.PLOIDY.key]: false,
      [CATEGORY_CONFIG.TAXONOMY_ID.key]: false,
      [CATEGORY_CONFIG.TAXONOMIC_LEVEL_CLASS.key]: false,
      [CATEGORY_CONFIG.TAXONOMIC_LEVEL_DOMAIN.key]: false,
      [CATEGORY_CONFIG.TAXONOMIC_LEVEL_FAMILY.key]: false,
      [CATEGORY_CONFIG.TAXONOMIC_LEVEL_GENUS.key]: false,
      [CATEGORY_CONFIG.TAXONOMIC_LEVEL_KINGDOM.key]: false,
      [CATEGORY_CONFIG.TAXONOMIC_LEVEL_ORDER.key]: false,
      [CATEGORY_CONFIG.TAXONOMIC_LEVEL_PHYLUM.key]: false,
      [CATEGORY_CONFIG.TAXONOMIC_LEVEL_REALM.key]: false,
      [CATEGORY_CONFIG.TAXONOMIC_LEVEL_SPECIES.key]: false,
    },
    sorting: [
      {
        desc: SORT_DIRECTION.DESCENDING,
        id: CATEGORY_CONFIG.CATEGORY.key,
      },
      {
        desc: SORT_DIRECTION.ASCENDING,
        id: CATEGORY_CONFIG.WORKFLOW_NAME.key,
      },
    ],
  },
};
