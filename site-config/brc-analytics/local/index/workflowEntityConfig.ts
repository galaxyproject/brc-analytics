import {
  EntityConfig,
  SORT_DIRECTION,
} from "@databiosphere/findable-ui/lib/config/entities";
import { EXPLORE_MODE } from "@databiosphere/findable-ui/lib/hooks/useExploreMode/types";
import { getWorkflowId } from "../../../../app/apis/catalog/brc-analytics-catalog/common/utils";
import { AppEntityConfig } from "../../../common/entities";
import { COLUMNS } from "./workflow/columns";
import {
  CATEGORY_CONFIG,
  CATEGORY_GROUP_CONFIG,
} from "./workflow/categoryGroupConfig";
import { WorkflowEntity } from "./workflow/types";

/**
 * Entity config object responsible to config anything related to the /workflows route.
 */
export const workflowEntityConfig: AppEntityConfig<WorkflowEntity> = {
  categoryGroupConfig: CATEGORY_GROUP_CONFIG,
  detail: {
    detailOverviews: [],
    staticLoad: true,
    tabs: [],
  },
  exploreMode: EXPLORE_MODE.CS_FETCH_CS_FILTERING,
  getId: getWorkflowId,
  label: "Workflows",
  list: {
    // Type cast to EntityConfig["list"]["columns"] as we are using TanStack table
    // columns instead of Findable UI table columns.
    columns: COLUMNS as EntityConfig<WorkflowEntity>["list"]["columns"],
    tableOptions: {
      initialState: {
        columnVisibility: {
          [CATEGORY_CONFIG.CATEGORY.key]: false,
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
    },
  },
  listView: {
    disablePagination: true,
  },
  route: "workflows",
  staticLoadFile: "catalog/output/workflows.json",
  ui: { title: "Workflows" },
};
