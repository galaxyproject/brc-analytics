import { EXPLORE_MODE } from "@databiosphere/findable-ui/lib/hooks/useExploreMode/types";
import { Outbreak } from "../../../../app/apis/catalog/brc-analytics-catalog/common/entities";
import { BRCEntityConfig } from "../../../common/entities";

/**
 * Entity config object responsible to config anything related to the /priority-pathogens route.
 */
export const priorityPathogensEntityConfig: BRCEntityConfig<Outbreak> = {
  categoryGroupConfig: undefined,
  detail: {
    detailOverviews: [],
    staticLoad: true,
    tabs: [],
  },
  exploreMode: EXPLORE_MODE.CS_FETCH_CS_FILTERING,
  explorerTitle: "Priority Pathogens",
  getId: (priorityPathogen) => priorityPathogen.name,
  label: "Priority Pathogens",
  list: {
    columns: [],
  },
  route: "priority-pathogens",
  staticLoadFile: "catalog/output/outbreaks.json",
};
