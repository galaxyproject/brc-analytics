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
import {
  BRC_DATA_CATALOG_CATEGORY_KEY,
  BRC_DATA_CATALOG_CATEGORY_LABEL,
} from "../../category";
import { assembliesMainColumn } from "../entity/organism/assembliesMainColumn";
import { assembliesTop } from "../entity/organism/assembliesTop";
import { CATEGORY_GROUPS } from "./common/category/categories";
import { COLUMN_REGISTRY } from "./common/column/columnRegistry";

/**
 * Entity config object responsible to config anything related to the /genomes route.
 */
export const organismEntityConfig: BRCEntityConfig<BRCDataCatalogOrganism> = {
  categoryGroupConfig: {
    categoryGroups: [
      {
        categoryConfigs: [
          {
            key: BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_LEVEL_SPECIES,
            label: BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMIC_LEVEL_SPECIES,
          },
          {
            key: BRC_DATA_CATALOG_CATEGORY_KEY.COMMON_NAME,
            label: BRC_DATA_CATALOG_CATEGORY_LABEL.COMMON_NAME,
          },
          {
            key: BRC_DATA_CATALOG_CATEGORY_KEY.ASSEMBLY_TAXONOMY_IDS,
            label: BRC_DATA_CATALOG_CATEGORY_LABEL.ASSEMBLY_TAXONOMY_IDS,
          },
        ],
      },
      CATEGORY_GROUPS.PRIORITY_PATHOGENS,
      {
        categoryConfigs: [
          {
            key: BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_LEVEL_GENUS,
            label: BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMIC_LEVEL_GENUS,
          },
          {
            key: BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_LEVEL_FAMILY,
            label: BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMIC_LEVEL_FAMILY,
          },
          {
            key: BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_LEVEL_ORDER,
            label: BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMIC_LEVEL_ORDER,
          },
          {
            key: BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_LEVEL_CLASS,
            label: BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMIC_LEVEL_CLASS,
          },
          {
            key: BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_LEVEL_PHYLUM,
            label: BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMIC_LEVEL_PHYLUM,
          },
          {
            key: BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_LEVEL_KINGDOM,
            label: BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMIC_LEVEL_KINGDOM,
          },
          {
            key: BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_LEVEL_REALM,
            label: BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMIC_LEVEL_REALM,
          },
          {
            key: BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_LEVEL_DOMAIN,
            label: BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMIC_LEVEL_DOMAIN,
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
  explorerTitle: "Organisms",
  getId: getOrganismId,
  label: "Organisms",
  list: {
    columns: [
      {
        componentConfig: {
          component: C.BasicCell,
          viewBuilder: V.buildTaxonomicLevelDomain,
        } as ComponentConfig<typeof C.BasicCell, BRCDataCatalogOrganism>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMIC_LEVEL_DOMAIN,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_LEVEL_DOMAIN,
        width: { max: "1fr", min: "auto" },
      },
      {
        componentConfig: {
          component: C.BasicCell,
          viewBuilder: V.buildTaxonomicLevelRealm,
        } as ComponentConfig<typeof C.BasicCell, BRCDataCatalogOrganism>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMIC_LEVEL_REALM,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_LEVEL_REALM,
        width: { max: "1fr", min: "auto" },
      },
      {
        componentConfig: {
          component: C.BasicCell,
          viewBuilder: V.buildTaxonomicLevelKingdom,
        } as ComponentConfig<typeof C.BasicCell, BRCDataCatalogOrganism>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMIC_LEVEL_KINGDOM,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_LEVEL_KINGDOM,
        width: { max: "1fr", min: "auto" },
      },
      {
        componentConfig: {
          component: C.BasicCell,
          viewBuilder: V.buildTaxonomicLevelPhylum,
        } as ComponentConfig<typeof C.BasicCell, BRCDataCatalogOrganism>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMIC_LEVEL_PHYLUM,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_LEVEL_PHYLUM,
        width: { max: "1fr", min: "auto" },
      },
      {
        componentConfig: {
          component: C.BasicCell,
          viewBuilder: V.buildTaxonomicLevelClass,
        } as ComponentConfig<typeof C.BasicCell, BRCDataCatalogOrganism>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMIC_LEVEL_CLASS,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_LEVEL_CLASS,
        width: { max: "1fr", min: "auto" },
      },
      {
        componentConfig: {
          component: C.BasicCell,
          viewBuilder: V.buildTaxonomicLevelOrder,
        } as ComponentConfig<typeof C.BasicCell, BRCDataCatalogOrganism>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMIC_LEVEL_ORDER,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_LEVEL_ORDER,
        width: { max: "1fr", min: "auto" },
      },
      {
        componentConfig: {
          component: C.BasicCell,
          viewBuilder: V.buildTaxonomicLevelFamily,
        } as ComponentConfig<typeof C.BasicCell, BRCDataCatalogOrganism>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMIC_LEVEL_FAMILY,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_LEVEL_FAMILY,
        width: { max: "1fr", min: "auto" },
      },
      {
        componentConfig: {
          component: C.BasicCell,
          viewBuilder: V.buildTaxonomicLevelGenus,
        } as ComponentConfig<typeof C.BasicCell, BRCDataCatalogOrganism>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMIC_LEVEL_GENUS,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_LEVEL_GENUS,
        width: { max: "1fr", min: "auto" },
      },
      {
        componentConfig: {
          component: C.Link,
          viewBuilder: V.buildOrganismTaxonomicLevelSpecies,
        } as ComponentConfig<typeof C.Link, BRCDataCatalogOrganism>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMIC_LEVEL_SPECIES,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_LEVEL_SPECIES,
        width: { max: "1fr", min: "auto" },
      },
      {
        componentConfig: {
          component: C.NTagCell,
          viewBuilder: V.buildOrganismTaxonomicLevelStrain,
        } as ComponentConfig<typeof C.NTagCell, BRCDataCatalogOrganism>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMIC_LEVEL_STRAIN,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_LEVEL_STRAIN,
        width: { max: "1fr", min: "auto" },
      },
      {
        componentConfig: {
          component: C.NTagCell,
          viewBuilder: V.buildOrganismTaxonomicLevelSerotype,
        } as ComponentConfig<typeof C.NTagCell, BRCDataCatalogOrganism>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMIC_LEVEL_SEROTYPE,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_LEVEL_SEROTYPE,
        width: { max: "1fr", min: "auto" },
      },
      {
        componentConfig: {
          component: C.NTagCell,
          viewBuilder: V.buildOrganismTaxonomicLevelIsolate,
        } as ComponentConfig<typeof C.NTagCell, BRCDataCatalogOrganism>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMIC_LEVEL_ISOLATE,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_LEVEL_ISOLATE,
        width: { max: "1fr", min: "auto" },
      },
      {
        componentConfig: {
          component: C.BasicCell,
          viewBuilder: V.buildCommonName,
        } as ComponentConfig<typeof C.BasicCell, BRCDataCatalogOrganism>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.COMMON_NAME,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.COMMON_NAME,
        width: { max: "0.65fr", min: "auto" },
      },
      {
        componentConfig: {
          component: C.NTagCell,
          viewBuilder: V.buildOrganismAssemblyTaxonomyIds,
        } as ComponentConfig<typeof C.NTagCell, BRCDataCatalogOrganism>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.ASSEMBLY_TAXONOMY_IDS,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.ASSEMBLY_TAXONOMY_IDS,
        width: { max: "0.65fr", min: "164px" },
      },
      {
        componentConfig: {
          component: C.NTagCell,
          viewBuilder: V.buildTaxonomicGroup,
        } as ComponentConfig<typeof C.NTagCell, BRCDataCatalogOrganism>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMIC_GROUP,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_GROUP,
        width: { max: "0.65fr", min: "164px" },
      },
      {
        componentConfig: {
          children: [
            {
              component: C.Chip,
              viewBuilder: V.buildPriorityPathogen,
            } as ComponentConfig<typeof C.Chip, BRCDataCatalogOrganism>,
          ],
          component: C.Tooltip,
          viewBuilder: V.buildPriorityPathogenTooltip,
        } as ComponentConfig<typeof C.Tooltip, BRCDataCatalogOrganism>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.PRIORITY_PATHOGEN_NAME,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.PRIORITY_PATHOGEN_NAME,
        width: { max: "0.5fr", min: "142px" },
      },
      {
        componentConfig: {
          component: C.BasicCell,
          viewBuilder: V.buildAssemblyCount,
        } as ComponentConfig<typeof C.BasicCell, BRCDataCatalogOrganism>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.ASSEMBLY_COUNT,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.ASSEMBLY_COUNT,
        width: { max: "0.65fr", min: "164px" },
      },
      COLUMN_REGISTRY.PRIORITY,
    ],
    tableOptions: {
      initialState: {
        columnVisibility: {
          [BRC_DATA_CATALOG_CATEGORY_KEY.PRIORITY]: false,
          [BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_LEVEL_CLASS]: false,
          [BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_LEVEL_FAMILY]: false,
          [BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_LEVEL_GENUS]: false,
          [BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_LEVEL_KINGDOM]: false,
          [BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_LEVEL_ORDER]: false,
          [BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_LEVEL_PHYLUM]: false,
          [BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_LEVEL_STRAIN]: false,
          [BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_LEVEL_SEROTYPE]: false,
          [BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_LEVEL_ISOLATE]: false,
          [BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_LEVEL_REALM]: false,
          [BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_LEVEL_DOMAIN]: false,
          [BRC_DATA_CATALOG_CATEGORY_KEY.COMMON_NAME]: false,
        },
        sorting: [
          {
            desc: SORT_DIRECTION.ASCENDING,
            id: BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_LEVEL_SPECIES,
          },
        ],
      },
    },
  } as ListConfig<BRCDataCatalogOrganism>,
  listView: {
    disablePagination: true,
    enableDownload: true,
    enableTab: false,
  },
  route: "organisms",
  staticLoadFile: "catalog/output/organisms.json",
};
