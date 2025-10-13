import { EXPLORE_MODE } from "@databiosphere/findable-ui/lib/hooks/useExploreMode/types";
import { Outbreak } from "../../../../app/apis/catalog/brc-analytics-catalog/common/entities";
import { AppEntityConfig } from "../../../common/entities";
import { priorityPathogenMainColumn } from "../entity/priorityPathogen/priorityPathogenMainColumn";
import { priorityPathogenTop } from "../entity/priorityPathogen/priorityPathogenTop";
import slugify from "slugify";
import { SLUGIFY_OPTIONS } from "../../../../app/common/constants";
import { priorityPathogenSideColumn } from "../entity/priorityPathogen/priorityPathogenSideColumn";

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
