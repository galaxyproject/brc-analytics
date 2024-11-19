import {
  ComponentConfig,
  ListConfig,
  SORT_DIRECTION,
} from "@databiosphere/findable-ui/lib/config/entities";
import { EXPLORE_MODE } from "@databiosphere/findable-ui/lib/hooks/useExploreMode";
import { BRCDataCatalogOrganism } from "../../../../app/apis/catalog/brc-analytics-catalog/common/entities";
import { getOrganismId } from "../../../../app/apis/catalog/brc-analytics-catalog/common/utils";
import * as C from "../../../../app/components";
import * as V from "../../../../app/viewModelBuilders/catalog/brc-analytics-catalog/common/viewModelBuilders";
import { BRCEntityConfig } from "../../../common/entities";
import {
  BRC_DATA_CATALOG_CATEGORY_KEY,
  BRC_DATA_CATALOG_CATEGORY_LABEL,
} from "../../category";

/**
 * Entity config object responsible to config anything related to the /genomes route.
 */
export const organismEntityConfig: BRCEntityConfig<BRCDataCatalogOrganism> = {
  categoryGroupConfig: {
    categoryGroups: [
      {
        categoryConfigs: [
          {
            key: BRC_DATA_CATALOG_CATEGORY_KEY.TAXON,
            label: BRC_DATA_CATALOG_CATEGORY_LABEL.TAXON,
          },
          {
            key: BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMY_ID,
            label: BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMY_ID,
          },
          {
            key: BRC_DATA_CATALOG_CATEGORY_KEY.TAGS,
            label: BRC_DATA_CATALOG_CATEGORY_LABEL.TAGS,
          },
        ],
      },
    ],
    key: "organisms",
  },
  detail: {
    detailOverviews: [],
    staticLoad: true,
    tabs: [],
  },
  exploreMode: EXPLORE_MODE.CS_FETCH_CS_FILTERING,
  explorerTitle: "Organisms",
  getId: getOrganismId,
  label: "Organisms",
  list: {
    columns: [
      {
        componentConfig: {
          component: C.BasicCell,
          viewBuilder: V.buildTaxon,
        } as ComponentConfig<typeof C.BasicCell, BRCDataCatalogOrganism>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.TAXON,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.TAXON,
        width: "auto",
      },
      {
        componentConfig: {
          component: C.BasicCell,
          viewBuilder: V.buildTaxonomyId,
        } as ComponentConfig<typeof C.BasicCell, BRCDataCatalogOrganism>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMY_ID,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMY_ID,
        width: { max: "0.5fr", min: "164px" },
      },
      {
        componentConfig: {
          component: C.BasicCell,
          viewBuilder: V.buildAssemblyCount,
        } as ComponentConfig<typeof C.BasicCell, BRCDataCatalogOrganism>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.ASSEMBLY_COUNT,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.ASSEMBLY_COUNT,
        width: { max: "0.5fr", min: "164px" },
      },
      {
        componentConfig: {
          component: C.NTagCell,
          viewBuilder: V.buildTags,
        } as ComponentConfig<typeof C.NTagCell, BRCDataCatalogOrganism>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.TAGS,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.TAGS,
        width: { max: "0.5fr", min: "142px" },
      },
    ],
    defaultSort: {
      desc: SORT_DIRECTION.ASCENDING,
      id: BRC_DATA_CATALOG_CATEGORY_KEY.TAXON,
    },
  } as ListConfig<BRCDataCatalogOrganism>,
  listView: {
    disablePagination: true,
    enableDownload: true,
    enableTab: false,
  },
  route: "organisms",
  staticLoadFile: "files/out/organisms.json",
};
