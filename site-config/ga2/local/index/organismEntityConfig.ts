import {
  ComponentConfig,
  ListConfig,
  SORT_DIRECTION,
} from "@databiosphere/findable-ui/lib/config/entities";
import { EXPLORE_MODE } from "@databiosphere/findable-ui/lib/hooks/useExploreMode/types";
import * as C from "../../../../app/components";
import { buildOrganismAssemblyTaxonomyIds } from "../../../../app/viewModelBuilders/catalog/brc-analytics-catalog/common/viewModelBuilders";
import { AppEntityConfig } from "../../../common/entities";
import { GA2_CATEGORY_KEY, GA2_CATEGORY_LABEL } from "../../category";
import { assembliesMainColumn } from "../entity/organism/assembliesMainColumn";
import { assembliesTop } from "../entity/organism/assembliesTop";
import { GA2OrganismEntity } from "../../../../app/apis/catalog/ga2/entities";
import { getOrganismId } from "../../../../app/apis/catalog/ga2/utils";
import {
  buildAssemblyCount,
  buildTaxonomicGroup,
} from "app/viewModelBuilders/catalog/brc-analytics-catalog/common/viewModelBuilders";
import * as V from "../../../../app/viewModelBuilders/catalog/ga2/viewModelBuilders";

/**
 * Entity config object responsible to config anything related to the /organisms route.
 */
export const organismEntityConfig: AppEntityConfig<GA2OrganismEntity> = {
  categoryGroupConfig: {
    categoryGroups: [
      {
        categoryConfigs: [
          {
            key: GA2_CATEGORY_KEY.SPECIES,
            label: GA2_CATEGORY_LABEL.SPECIES,
          },
          {
            key: GA2_CATEGORY_KEY.ASSEMBLY_TAXONOMY_IDS,
            label: GA2_CATEGORY_LABEL.ASSEMBLY_TAXONOMY_IDS,
          },
        ],
      },
    ],
    key: "organisms",
  },
  detail: {
    detailOverviews: [],
    staticLoad: true,
    tabs: [
      {
        label: "Assemblies",
        mainColumn: assembliesMainColumn,
        route: "",
        top: assembliesTop,
      },
    ],
  },
  exploreMode: EXPLORE_MODE.CS_FETCH_CS_FILTERING,
  getId: getOrganismId,
  label: "Organisms",
  list: {
    columns: [
      {
        componentConfig: {
          component: C.Link,
          viewBuilder: V.buildOrganismSpecies,
        } as ComponentConfig<typeof C.Link, GA2OrganismEntity>,
        header: GA2_CATEGORY_LABEL.SPECIES,
        id: GA2_CATEGORY_KEY.SPECIES,
        meta: { columnPinned: true },
        width: { max: "1fr", min: "auto" },
      },
      {
        componentConfig: {
          component: C.NTagCell,
          viewBuilder: buildOrganismAssemblyTaxonomyIds,
        } as ComponentConfig<typeof C.NTagCell, GA2OrganismEntity>,
        header: GA2_CATEGORY_LABEL.ASSEMBLY_TAXONOMY_IDS,
        id: GA2_CATEGORY_KEY.ASSEMBLY_TAXONOMY_IDS,
        width: { max: "0.65fr", min: "164px" },
      },
      {
        componentConfig: {
          component: C.NTagCell,
          viewBuilder: buildTaxonomicGroup,
        } as ComponentConfig<typeof C.NTagCell, GA2OrganismEntity>,
        header: GA2_CATEGORY_LABEL.TAXONOMIC_GROUP,
        id: GA2_CATEGORY_KEY.TAXONOMIC_GROUP,
        width: { max: "0.65fr", min: "164px" },
      },
      {
        componentConfig: {
          component: C.BasicCell,
          viewBuilder: buildAssemblyCount,
        } as ComponentConfig<typeof C.BasicCell, GA2OrganismEntity>,
        header: GA2_CATEGORY_LABEL.ASSEMBLY_COUNT,
        id: GA2_CATEGORY_KEY.ASSEMBLY_COUNT,
        width: { max: "0.65fr", min: "164px" },
      },
    ],
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
  } as ListConfig<GA2OrganismEntity>,
  listView: {
    disablePagination: true,
    enableDownload: true,
  },
  route: "organisms",
  staticLoadFile: "catalog/output/organisms.json",
  ui: { title: "Organisms" },
};
