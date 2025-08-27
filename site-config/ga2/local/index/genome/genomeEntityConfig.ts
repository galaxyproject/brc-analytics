import {
  ListConfig,
  SORT_DIRECTION,
} from "@databiosphere/findable-ui/lib/config/entities";
import { EXPLORE_MODE } from "@databiosphere/findable-ui/lib/hooks/useExploreMode/types";
import { AppEntityConfig } from "../../../../common/entities";
import { CATEGORY_GROUPS } from "./categoryGroups";
import { mainColumn as analysisMethodsMainColumn } from "../../entity/genome/analysisMethodMainColumn";
import { sideColumn as analysisMethodsSideColumn } from "../../entity/genome/analysisMethodsSideColumn";
import { top as analysisMethodsTop } from "../../entity/genome/analysisMethodsTop";
import { GA2AssemblyEntity } from "../../../../../app/apis/catalog/ga2/entities";
import {
  getAssemblyId,
  getAssemblyTitle,
} from "../../../../../app/apis/catalog/ga2/utils";
import { COLUMNS } from "./columns";
import { GA2_CATEGORY_KEY } from "../../../category";

/**
 * Entity config object responsible to config anything related to the /assemblies route.
 */
export const genomeEntityConfig: AppEntityConfig<GA2AssemblyEntity> = {
  categoryGroupConfig: {
    categoryGroups: CATEGORY_GROUPS,
    key: "assemblies",
  },
  detail: {
    detailOverviews: [],
    staticLoad: true,
    tabs: [
      {
        label: "Choose Analysis Method",
        mainColumn: analysisMethodsMainColumn,
        route: "",
        sideColumn: analysisMethodsSideColumn,
        top: analysisMethodsTop,
      },
    ],
  },
  exploreMode: EXPLORE_MODE.CS_FETCH_CS_FILTERING,
  getId: getAssemblyId,
  getTitle: getAssemblyTitle,
  label: "Assemblies",
  list: {
    columns: COLUMNS,
    tableOptions: {
      initialState: {
        sorting: [
          {
            desc: SORT_DIRECTION.ASCENDING,
            id: GA2_CATEGORY_KEY.SPECIES,
          },
        ],
      },
    },
  } as ListConfig<GA2AssemblyEntity>,
  listView: {
    disablePagination: true,
    enableDownload: true,
  },
  route: "assemblies",
  staticLoadFile: "site-config/ga2/local/catalog/genomes.json",
  ui: { title: "Assemblies" },
};
