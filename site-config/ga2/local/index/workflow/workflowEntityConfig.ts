import { type EntityConfig } from "@databiosphere/findable-ui/lib/config/entities";
import { EXPLORE_MODE } from "@databiosphere/findable-ui/lib/hooks/useExploreMode/types";
import { getWorkflowId } from "@ga2/apis/utils";
import { type AppEntityConfig } from "@repo/shared/config/types";
import { type WorkflowEntity } from "@repo/shared/views/WorkflowsView/types";
import { CATEGORY_GROUP_CONFIG } from "./categoryGroupConfig";
import { COLUMNS } from "./columns";
import { TABLE_OPTIONS } from "./tableOptions";

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
    tableOptions: TABLE_OPTIONS,
  },
  listView: {
    disablePagination: true,
  },
  route: "workflows",
  staticLoadFile: "catalog/output/workflows.json",
  ui: { title: "Workflows" },
};
