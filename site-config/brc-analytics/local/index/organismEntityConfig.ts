import { type BRCDataCatalogOrganism } from "@brc/apis/organism";
import { getOrganismId } from "@brc/apis/utils";
import * as V from "@brc/viewModelBuilders/viewModelBuilders";
import { Link } from "@databiosphere/findable-ui/lib/components/Links/components/Link/link";
import { BasicCell } from "@databiosphere/findable-ui/lib/components/Table/components/TableCell/components/BasicCell/basicCell";
import { NTagCell } from "@databiosphere/findable-ui/lib/components/Table/components/TableCell/components/NTagCell/nTagCell";
import {
  type ComponentConfig,
  type ListConfig,
  SORT_DIRECTION,
} from "@databiosphere/findable-ui/lib/config/entities";
import { EXPLORE_MODE } from "@databiosphere/findable-ui/lib/hooks/useExploreMode/types";
import { Chip } from "@mui/material";
import { Tooltip } from "@repo/shared/components/Tooltip/tooltip";
import { type AppEntityConfig } from "@repo/shared/config/types";
import {
  BRC_DATA_CATALOG_CATEGORY_KEY,
  BRC_DATA_CATALOG_CATEGORY_LABEL,
} from "@site-config/brc-analytics/category";
import { organismMainColumn } from "@site-config/brc-analytics/local/entity/organism/organismMainColumn";
import { organismTop } from "@site-config/brc-analytics/local/entity/organism/organismTop";
import { CATEGORY_GROUPS } from "./common/category/categories";
import { COLUMN_REGISTRY } from "./common/column/columnRegistry";

/**
 * Entity config object responsible to config anything related to the /genomes route.
 */
export const organismEntityConfig: AppEntityConfig<BRCDataCatalogOrganism> = {
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
      CATEGORY_GROUPS.PRIORITY_PATHOGENS,
    ],
    key: "organisms",
  },
  detail: {
    detailOverviews: [],
    staticLoad: true,
    tabs: [
      {
        label: "Overview",
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
    columns: [
      {
        componentConfig: {
          component: BasicCell,
          viewBuilder: V.buildTaxonomicLevelDomain,
        } as ComponentConfig<typeof BasicCell, BRCDataCatalogOrganism>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMIC_LEVEL_DOMAIN,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_LEVEL_DOMAIN,
        width: { max: "1fr", min: "auto" },
      },
      {
        componentConfig: {
          component: BasicCell,
          viewBuilder: V.buildTaxonomicLevelRealm,
        } as ComponentConfig<typeof BasicCell, BRCDataCatalogOrganism>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMIC_LEVEL_REALM,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_LEVEL_REALM,
        width: { max: "1fr", min: "auto" },
      },
      {
        componentConfig: {
          component: BasicCell,
          viewBuilder: V.buildTaxonomicLevelKingdom,
        } as ComponentConfig<typeof BasicCell, BRCDataCatalogOrganism>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMIC_LEVEL_KINGDOM,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_LEVEL_KINGDOM,
        width: { max: "1fr", min: "auto" },
      },
      {
        componentConfig: {
          component: BasicCell,
          viewBuilder: V.buildTaxonomicLevelPhylum,
        } as ComponentConfig<typeof BasicCell, BRCDataCatalogOrganism>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMIC_LEVEL_PHYLUM,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_LEVEL_PHYLUM,
        width: { max: "1fr", min: "auto" },
      },
      {
        componentConfig: {
          component: BasicCell,
          viewBuilder: V.buildTaxonomicLevelClass,
        } as ComponentConfig<typeof BasicCell, BRCDataCatalogOrganism>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMIC_LEVEL_CLASS,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_LEVEL_CLASS,
        width: { max: "1fr", min: "auto" },
      },
      {
        componentConfig: {
          component: BasicCell,
          viewBuilder: V.buildTaxonomicLevelOrder,
        } as ComponentConfig<typeof BasicCell, BRCDataCatalogOrganism>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMIC_LEVEL_ORDER,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_LEVEL_ORDER,
        width: { max: "1fr", min: "auto" },
      },
      {
        componentConfig: {
          component: BasicCell,
          viewBuilder: V.buildTaxonomicLevelFamily,
        } as ComponentConfig<typeof BasicCell, BRCDataCatalogOrganism>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMIC_LEVEL_FAMILY,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_LEVEL_FAMILY,
        width: { max: "1fr", min: "auto" },
      },
      {
        componentConfig: {
          component: BasicCell,
          viewBuilder: V.buildTaxonomicLevelGenus,
        } as ComponentConfig<typeof BasicCell, BRCDataCatalogOrganism>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMIC_LEVEL_GENUS,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_LEVEL_GENUS,
        width: { max: "1fr", min: "auto" },
      },
      {
        componentConfig: {
          component: Link,
          viewBuilder: V.buildOrganismTaxonomicLevelSpecies,
        } as ComponentConfig<typeof Link, BRCDataCatalogOrganism>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMIC_LEVEL_SPECIES,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_LEVEL_SPECIES,
        meta: { columnPinned: true },
        width: { max: "1fr", min: "auto" },
      },
      {
        componentConfig: {
          component: NTagCell,
          viewBuilder: V.buildOrganismTaxonomicLevelStrain,
        } as ComponentConfig<typeof NTagCell, BRCDataCatalogOrganism>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMIC_LEVEL_STRAIN,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_LEVEL_STRAIN,
        width: { max: "1fr", min: "auto" },
      },
      {
        componentConfig: {
          component: NTagCell,
          viewBuilder: V.buildOrganismTaxonomicLevelSerotype,
        } as ComponentConfig<typeof NTagCell, BRCDataCatalogOrganism>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMIC_LEVEL_SEROTYPE,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_LEVEL_SEROTYPE,
        width: { max: "1fr", min: "auto" },
      },
      {
        componentConfig: {
          component: NTagCell,
          viewBuilder: V.buildOrganismTaxonomicLevelIsolate,
        } as ComponentConfig<typeof NTagCell, BRCDataCatalogOrganism>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMIC_LEVEL_ISOLATE,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_LEVEL_ISOLATE,
        width: { max: "1fr", min: "auto" },
      },
      {
        componentConfig: {
          component: NTagCell,
          viewBuilder: V.buildCommonNames,
        } as ComponentConfig<typeof NTagCell, BRCDataCatalogOrganism>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.COMMON_NAME,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.COMMON_NAME,
        width: { max: "0.65fr", min: "auto" },
      },
      {
        componentConfig: {
          component: NTagCell,
          viewBuilder: V.buildOrganismAssemblyTaxonomyIds,
        } as ComponentConfig<typeof NTagCell, BRCDataCatalogOrganism>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.ASSEMBLY_TAXONOMY_IDS,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.ASSEMBLY_TAXONOMY_IDS,
        width: { max: "0.65fr", min: "164px" },
      },
      {
        componentConfig: {
          component: NTagCell,
          viewBuilder: V.buildOrganismTaxonomicGroup,
        } as ComponentConfig<typeof NTagCell, BRCDataCatalogOrganism>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMIC_GROUP,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_GROUP,
        width: { max: "0.65fr", min: "164px" },
      },
      {
        componentConfig: {
          children: [
            {
              component: Chip,
              viewBuilder: V.buildPriorityPathogen,
            } as ComponentConfig<typeof Chip, BRCDataCatalogOrganism>,
          ],
          component: Tooltip,
          viewBuilder: V.buildPriorityPathogenTooltip,
        } as ComponentConfig<typeof Tooltip, BRCDataCatalogOrganism>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.PRIORITY_PATHOGEN_NAME,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.PRIORITY_PATHOGEN_NAME,
        width: { max: "0.5fr", min: "142px" },
      },
      {
        componentConfig: {
          component: BasicCell,
          viewBuilder: V.buildAssemblyCount,
        } as ComponentConfig<typeof BasicCell, BRCDataCatalogOrganism>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.ASSEMBLY_COUNT,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.ASSEMBLY_COUNT,
        width: { max: "0.65fr", min: "164px" },
      },
      COLUMN_REGISTRY.PRIORITY,
    ],
    tableOptions: {
      downloadFilename: "organisms",
      enableTableDownload: true,
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
  },
  route: "organisms",
  staticLoadFile: "catalog/output/organisms.json",
  ui: { title: "Organisms" },
};
