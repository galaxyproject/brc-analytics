import { type Outbreak } from "@/apis/catalog/brc-analytics-catalog/common/entities";
import { SLUGIFY_OPTIONS } from "@/common/constants";
import { EXPLORE_MODE } from "@databiosphere/findable-ui/lib/hooks/useExploreMode/types";
import { priorityPathogenMainColumn } from "@site-config/brc-analytics/local/entity/priorityPathogen/priorityPathogenMainColumn";
import { priorityPathogenSideColumn } from "@site-config/brc-analytics/local/entity/priorityPathogen/priorityPathogenSideColumn";
import { priorityPathogenTop } from "@site-config/brc-analytics/local/entity/priorityPathogen/priorityPathogenTop";
import { type AppEntityConfig } from "@site-config/common/entities";
import slugify from "slugify";

/**
 * Entity config object responsible to config anything related to the /priority-pathogens route.
 */
export const priorityPathogensEntityConfig: AppEntityConfig<Outbreak> = {
  categoryGroupConfig: undefined,
  detail: {
    detailOverviews: [],
    staticLoad: true,
    tabs: [
      {
        label: "Priority Pathogen",
        mainColumn: priorityPathogenMainColumn,
        route: "",
        sideColumn: priorityPathogenSideColumn,
        top: priorityPathogenTop,
      },
    ],
  },
  exploreMode: EXPLORE_MODE.CS_FETCH_CS_FILTERING,
  getId: (priorityPathogen) => slugify(priorityPathogen.name, SLUGIFY_OPTIONS),
  label: "Priority Pathogens",
  list: {
    columns: [],
  },
  route: "priority-pathogens",
  staticLoadFile: "catalog/output/outbreaks.json",
  ui: { title: "Priority Pathogens" },
};
