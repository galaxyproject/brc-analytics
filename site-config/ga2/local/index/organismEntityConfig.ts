import {
  ComponentConfig,
  ListConfig,
  SORT_DIRECTION,
} from "@databiosphere/findable-ui/lib/config/entities";
import { EXPLORE_MODE } from "@databiosphere/findable-ui/lib/hooks/useExploreMode/types";
import { BRCDataCatalogOrganism } from "../../../../app/apis/catalog/brc-analytics-catalog/common/entities";
import { getOrganismId } from "../../../../app/apis/catalog/brc-analytics-catalog/common/utils";
import * as C from "../../../../app/components";
import * as V from "../../../../app/viewModelBuilders/catalog/brc-analytics-catalog/common/viewModelBuilders";
import { BRCEntityConfig } from "../../../common/entities";
import { GA2_CATEGORY_KEY, GA2_CATEGORY_LABEL } from "../../category";
import { assembliesMainColumn } from "../entity/organism/assembliesMainColumn";
import { assembliesTop } from "../entity/organism/assembliesTop";

/**
 * Entity config object responsible to config anything related to the /organisms route.
 */
export const organismEntityConfig: BRCEntityConfig<BRCDataCatalogOrganism> = {
  categoryGroupConfig: {
    categoryGroups: [
      {
        categoryConfigs: [
          {
            key: GA2_CATEGORY_KEY.TAXONOMIC_LEVEL_SPECIES,
            label: GA2_CATEGORY_LABEL.TAXONOMIC_LEVEL_SPECIES,
          },
          {
            key: GA2_CATEGORY_KEY.COMMON_NAME,
            label: GA2_CATEGORY_LABEL.COMMON_NAME,
          },
          {
            key: GA2_CATEGORY_KEY.ASSEMBLY_TAXONOMY_IDS,
            label: GA2_CATEGORY_LABEL.ASSEMBLY_TAXONOMY_IDS,
          },
        ],
      },
      {
        categoryConfigs: [
          {
            key: GA2_CATEGORY_KEY.TAXONOMIC_LEVEL_GENUS,
            label: GA2_CATEGORY_LABEL.TAXONOMIC_LEVEL_GENUS,
          },
          {
            key: GA2_CATEGORY_KEY.TAXONOMIC_LEVEL_FAMILY,
            label: GA2_CATEGORY_LABEL.TAXONOMIC_LEVEL_FAMILY,
          },
          {
            key: GA2_CATEGORY_KEY.TAXONOMIC_LEVEL_ORDER,
            label: GA2_CATEGORY_LABEL.TAXONOMIC_LEVEL_ORDER,
          },
          {
            key: GA2_CATEGORY_KEY.TAXONOMIC_LEVEL_CLASS,
            label: GA2_CATEGORY_LABEL.TAXONOMIC_LEVEL_CLASS,
          },
          {
            key: GA2_CATEGORY_KEY.TAXONOMIC_LEVEL_PHYLUM,
            label: GA2_CATEGORY_LABEL.TAXONOMIC_LEVEL_PHYLUM,
          },
          {
            key: GA2_CATEGORY_KEY.TAXONOMIC_LEVEL_KINGDOM,
            label: GA2_CATEGORY_LABEL.TAXONOMIC_LEVEL_KINGDOM,
          },
          {
            key: GA2_CATEGORY_KEY.TAXONOMIC_LEVEL_REALM,
            label: GA2_CATEGORY_LABEL.TAXONOMIC_LEVEL_REALM,
          },
          {
            key: GA2_CATEGORY_KEY.TAXONOMIC_LEVEL_DOMAIN,
            label: GA2_CATEGORY_LABEL.TAXONOMIC_LEVEL_DOMAIN,
          },
        ],
        label: "Taxonomic Lineage",
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
          component: C.BasicCell,
          viewBuilder: V.buildTaxonomicLevelDomain,
        } as ComponentConfig<typeof C.BasicCell, BRCDataCatalogOrganism>,
        header: GA2_CATEGORY_LABEL.TAXONOMIC_LEVEL_DOMAIN,
        id: GA2_CATEGORY_KEY.TAXONOMIC_LEVEL_DOMAIN,
        width: { max: "1fr", min: "auto" },
      },
      {
        componentConfig: {
          component: C.BasicCell,
          viewBuilder: V.buildTaxonomicLevelRealm,
        } as ComponentConfig<typeof C.BasicCell, BRCDataCatalogOrganism>,
        header: GA2_CATEGORY_LABEL.TAXONOMIC_LEVEL_REALM,
        id: GA2_CATEGORY_KEY.TAXONOMIC_LEVEL_REALM,
        width: { max: "1fr", min: "auto" },
      },
      {
        componentConfig: {
          component: C.BasicCell,
          viewBuilder: V.buildTaxonomicLevelKingdom,
        } as ComponentConfig<typeof C.BasicCell, BRCDataCatalogOrganism>,
        header: GA2_CATEGORY_LABEL.TAXONOMIC_LEVEL_KINGDOM,
        id: GA2_CATEGORY_KEY.TAXONOMIC_LEVEL_KINGDOM,
        width: { max: "1fr", min: "auto" },
      },
      {
        componentConfig: {
          component: C.BasicCell,
          viewBuilder: V.buildTaxonomicLevelPhylum,
        } as ComponentConfig<typeof C.BasicCell, BRCDataCatalogOrganism>,
        header: GA2_CATEGORY_LABEL.TAXONOMIC_LEVEL_PHYLUM,
        id: GA2_CATEGORY_KEY.TAXONOMIC_LEVEL_PHYLUM,
        width: { max: "1fr", min: "auto" },
      },
      {
        componentConfig: {
          component: C.BasicCell,
          viewBuilder: V.buildTaxonomicLevelClass,
        } as ComponentConfig<typeof C.BasicCell, BRCDataCatalogOrganism>,
        header: GA2_CATEGORY_LABEL.TAXONOMIC_LEVEL_CLASS,
        id: GA2_CATEGORY_KEY.TAXONOMIC_LEVEL_CLASS,
        width: { max: "1fr", min: "auto" },
      },
      {
        componentConfig: {
          component: C.BasicCell,
          viewBuilder: V.buildTaxonomicLevelOrder,
        } as ComponentConfig<typeof C.BasicCell, BRCDataCatalogOrganism>,
        header: GA2_CATEGORY_LABEL.TAXONOMIC_LEVEL_ORDER,
        id: GA2_CATEGORY_KEY.TAXONOMIC_LEVEL_ORDER,
        width: { max: "1fr", min: "auto" },
      },
      {
        componentConfig: {
          component: C.BasicCell,
          viewBuilder: V.buildTaxonomicLevelFamily,
        } as ComponentConfig<typeof C.BasicCell, BRCDataCatalogOrganism>,
        header: GA2_CATEGORY_LABEL.TAXONOMIC_LEVEL_FAMILY,
        id: GA2_CATEGORY_KEY.TAXONOMIC_LEVEL_FAMILY,
        width: { max: "1fr", min: "auto" },
      },
      {
        componentConfig: {
          component: C.BasicCell,
          viewBuilder: V.buildTaxonomicLevelGenus,
        } as ComponentConfig<typeof C.BasicCell, BRCDataCatalogOrganism>,
        header: GA2_CATEGORY_LABEL.TAXONOMIC_LEVEL_GENUS,
        id: GA2_CATEGORY_KEY.TAXONOMIC_LEVEL_GENUS,
        width: { max: "1fr", min: "auto" },
      },
      {
        componentConfig: {
          component: C.Link,
          viewBuilder: V.buildOrganismTaxonomicLevelSpecies,
        } as ComponentConfig<typeof C.Link, BRCDataCatalogOrganism>,
        header: GA2_CATEGORY_LABEL.TAXONOMIC_LEVEL_SPECIES,
        id: GA2_CATEGORY_KEY.TAXONOMIC_LEVEL_SPECIES,
        meta: { columnPinned: true },
        width: { max: "1fr", min: "auto" },
      },
      {
        componentConfig: {
          component: C.NTagCell,
          viewBuilder: V.buildOrganismTaxonomicLevelStrain,
        } as ComponentConfig<typeof C.NTagCell, BRCDataCatalogOrganism>,
        header: GA2_CATEGORY_LABEL.TAXONOMIC_LEVEL_STRAIN,
        id: GA2_CATEGORY_KEY.TAXONOMIC_LEVEL_STRAIN,
        width: { max: "1fr", min: "auto" },
      },
      {
        componentConfig: {
          component: C.NTagCell,
          viewBuilder: V.buildOrganismTaxonomicLevelSerotype,
        } as ComponentConfig<typeof C.NTagCell, BRCDataCatalogOrganism>,
        header: GA2_CATEGORY_LABEL.TAXONOMIC_LEVEL_SEROTYPE,
        id: GA2_CATEGORY_KEY.TAXONOMIC_LEVEL_SEROTYPE,
        width: { max: "1fr", min: "auto" },
      },
      {
        componentConfig: {
          component: C.NTagCell,
          viewBuilder: V.buildOrganismTaxonomicLevelIsolate,
        } as ComponentConfig<typeof C.NTagCell, BRCDataCatalogOrganism>,
        header: GA2_CATEGORY_LABEL.TAXONOMIC_LEVEL_ISOLATE,
        id: GA2_CATEGORY_KEY.TAXONOMIC_LEVEL_ISOLATE,
        width: { max: "1fr", min: "auto" },
      },
      {
        componentConfig: {
          component: C.BasicCell,
          viewBuilder: V.buildCommonName,
        } as ComponentConfig<typeof C.BasicCell, BRCDataCatalogOrganism>,
        header: GA2_CATEGORY_LABEL.COMMON_NAME,
        id: GA2_CATEGORY_KEY.COMMON_NAME,
        width: { max: "0.65fr", min: "auto" },
      },
      {
        componentConfig: {
          component: C.NTagCell,
          viewBuilder: V.buildOrganismAssemblyTaxonomyIds,
        } as ComponentConfig<typeof C.NTagCell, BRCDataCatalogOrganism>,
        header: GA2_CATEGORY_LABEL.ASSEMBLY_TAXONOMY_IDS,
        id: GA2_CATEGORY_KEY.ASSEMBLY_TAXONOMY_IDS,
        width: { max: "0.65fr", min: "164px" },
      },
      {
        componentConfig: {
          component: C.NTagCell,
          viewBuilder: V.buildTaxonomicGroup,
        } as ComponentConfig<typeof C.NTagCell, BRCDataCatalogOrganism>,
        header: GA2_CATEGORY_LABEL.TAXONOMIC_GROUP,
        id: GA2_CATEGORY_KEY.TAXONOMIC_GROUP,
        width: { max: "0.65fr", min: "164px" },
      },
      {
        componentConfig: {
          component: C.BasicCell,
          viewBuilder: V.buildAssemblyCount,
        } as ComponentConfig<typeof C.BasicCell, BRCDataCatalogOrganism>,
        header: GA2_CATEGORY_LABEL.ASSEMBLY_COUNT,
        id: GA2_CATEGORY_KEY.ASSEMBLY_COUNT,
        width: { max: "0.65fr", min: "164px" },
      },
    ],
    tableOptions: {
      initialState: {
        columnVisibility: {
          [GA2_CATEGORY_KEY.TAXONOMIC_LEVEL_CLASS]: false,
          [GA2_CATEGORY_KEY.TAXONOMIC_LEVEL_FAMILY]: false,
          [GA2_CATEGORY_KEY.TAXONOMIC_LEVEL_GENUS]: false,
          [GA2_CATEGORY_KEY.TAXONOMIC_LEVEL_KINGDOM]: false,
          [GA2_CATEGORY_KEY.TAXONOMIC_LEVEL_ORDER]: false,
          [GA2_CATEGORY_KEY.TAXONOMIC_LEVEL_PHYLUM]: false,
          [GA2_CATEGORY_KEY.TAXONOMIC_LEVEL_STRAIN]: false,
          [GA2_CATEGORY_KEY.TAXONOMIC_LEVEL_SEROTYPE]: false,
          [GA2_CATEGORY_KEY.TAXONOMIC_LEVEL_ISOLATE]: false,
          [GA2_CATEGORY_KEY.TAXONOMIC_LEVEL_REALM]: false,
          [GA2_CATEGORY_KEY.TAXONOMIC_LEVEL_DOMAIN]: false,
          [GA2_CATEGORY_KEY.COMMON_NAME]: false,
        },
        sorting: [
          {
            desc: SORT_DIRECTION.ASCENDING,
            id: GA2_CATEGORY_KEY.TAXONOMIC_LEVEL_SPECIES,
          },
        ],
      },
    },
  } as ListConfig<BRCDataCatalogOrganism>,
  listView: {
    disablePagination: true,
    enableDownload: true,
  },
  route: "organisms",
  staticLoadFile: "catalog/output/organisms.json",
  ui: { title: "Organisms" },
};
