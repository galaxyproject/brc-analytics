import {
  ListConfig,
  SORT_DIRECTION,
} from "@databiosphere/findable-ui/lib/config/entities";
import { EXPLORE_MODE } from "@databiosphere/findable-ui/lib/hooks/useExploreMode/types";
import { AppEntityConfig } from "../../../../common/entities";
import { GA2_CATEGORY_KEY } from "../../../category";
import { organismMainColumn } from "../../entity/organism/organismMainColumn";
import { organismTop } from "../../entity/organism/organismTop";
import { GA2OrganismEntity } from "../../../../../app/apis/catalog/ga2/entities";
import { getOrganismId } from "../../../../../app/apis/catalog/ga2/utils";
import { CATEGORY_GROUPS } from "./categoryGroups";
import { COLUMNS } from "./columns";

/**
 * Entity config object responsible to config anything related to the /organisms route.
 */
export const organismEntityConfig: AppEntityConfig<GA2OrganismEntity> = {
  categoryGroupConfig: {
    categoryGroups: CATEGORY_GROUPS,
    key: "organisms",
  },
  detail: {
    detailOverviews: [],
    staticLoad: true,
    tabs: [
      {
        label: "Organism",
        mainColumn: organismMainColumn,
        route: "",
        top: organismTop,
      },
    ],
  },
  exploreMode: EXPLORE_MODE.CS_FETCH_CS_FILTERING,
  getId: getOrganismId,
  label: "Organisms",
  list: {
    columns: COLUMNS,
    tableOptions: {
      initialState: {
        sorting: [
          {
            desc: SORT_DIRECTION.ASCENDING,
            id: GA2_CATEGORY_KEY.TAXONOMIC_LEVEL_SPECIES,
          },
        ],
      },
    },
  } as ListConfig<GA2OrganismEntity>,
  listView: {
    disablePagination: true,
    enableDownload: true,
  },
  route: "organisms",
  staticLoadFile: "site-config/ga2/local/catalog/organisms.json",
  ui: { title: "Organisms" },
};
