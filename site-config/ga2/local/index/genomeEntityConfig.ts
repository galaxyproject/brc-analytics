import {
  ComponentConfig,
  ListConfig,
  SORT_DIRECTION,
} from "@databiosphere/findable-ui/lib/config/entities";
import { EXPLORE_MODE } from "@databiosphere/findable-ui/lib/hooks/useExploreMode/types";
import { BRCDataCatalogGenome } from "../../../../app/apis/catalog/brc-analytics-catalog/common/entities";
import {
  getGenomeId,
  getGenomeTitle,
} from "../../../../app/apis/catalog/brc-analytics-catalog/common/utils";
import * as C from "../../../../app/components";
import * as V from "../../../../app/viewModelBuilders/catalog/brc-analytics-catalog/common/viewModelBuilders";
import { BRCEntityConfig } from "../../../common/entities";
import {
  BRC_DATA_CATALOG_CATEGORY_KEY,
  BRC_DATA_CATALOG_CATEGORY_LABEL,
} from "../../category";
import { mainColumn as analysisMethodsMainColumn } from "../entity/genome/analysisMethodMainColumn";
import { sideColumn as analysisMethodsSideColumn } from "../entity/genome/analysisMethodsSideColumn";
import { top as analysisMethodsTop } from "../entity/genome/analysisMethodsTop";
import { CATEGORY_GROUPS } from "./common/category/categories";
import { COLUMN_REGISTRY } from "./common/column/columnRegistry";

/**
 * Entity config object responsible to config anything related to the /assemblies route.
 */
export const genomeEntityConfig: BRCEntityConfig<BRCDataCatalogGenome> = {
  categoryGroupConfig: {
    categoryGroups: [
      {
        categoryConfigs: [
          {
            key: BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_LEVEL_SPECIES,
            label: BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMIC_LEVEL_SPECIES,
          },
          {
            key: BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_LEVEL_STRAIN,
            label: BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMIC_LEVEL_STRAIN,
          },
          {
            key: BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_LEVEL_SEROTYPE,
            label: BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMIC_LEVEL_SEROTYPE,
          },
          {
            key: BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_LEVEL_ISOLATE,
            label: BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMIC_LEVEL_ISOLATE,
          },
          {
            key: BRC_DATA_CATALOG_CATEGORY_KEY.COMMON_NAME,
            label: BRC_DATA_CATALOG_CATEGORY_LABEL.COMMON_NAME,
          },
          {
            key: BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMY_ID,
            label: BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMY_ID,
          },
        ],
        label: "Organism",
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
      {
        categoryConfigs: [
          {
            key: BRC_DATA_CATALOG_CATEGORY_KEY.ACCESSION,
            label: BRC_DATA_CATALOG_CATEGORY_LABEL.ACCESSION,
          },
          {
            key: BRC_DATA_CATALOG_CATEGORY_KEY.IS_REF,
            label: BRC_DATA_CATALOG_CATEGORY_LABEL.IS_REF,
          },
          {
            key: BRC_DATA_CATALOG_CATEGORY_KEY.LEVEL,
            label: BRC_DATA_CATALOG_CATEGORY_LABEL.LEVEL,
          },
          {
            key: BRC_DATA_CATALOG_CATEGORY_KEY.COVERAGE,
            label: BRC_DATA_CATALOG_CATEGORY_LABEL.COVERAGE,
          },
          {
            key: BRC_DATA_CATALOG_CATEGORY_KEY.ANNOTATION_STATUS,
            label: BRC_DATA_CATALOG_CATEGORY_LABEL.ANNOTATION_STATUS,
          },
        ],
        label: "Assembly",
      },
    ],
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
  getId: getGenomeId,
  getTitle: getGenomeTitle,
  label: "Assemblies",
  list: {
    columns: [
      {
        componentConfig: {
          component: C.AnalyzeGenome,
          viewBuilder: V.buildAnalyzeGenome,
        } as ComponentConfig<typeof C.AnalyzeGenome, BRCDataCatalogGenome>,
        enableSorting: false,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.ANALYZE_GENOME,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.ANALYZE_GENOME,
        width: "auto",
      },
      {
        columnPinned: true,
        componentConfig: {
          component: C.BasicCell,
          viewBuilder: V.buildAccession,
        } as ComponentConfig<typeof C.BasicCell, BRCDataCatalogGenome>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.ACCESSION,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.ACCESSION,
        width: { max: "1fr", min: "164px" },
      },
      {
        componentConfig: {
          component: C.BasicCell,
          viewBuilder: V.buildTaxonomicLevelDomain,
        } as ComponentConfig<typeof C.BasicCell, BRCDataCatalogGenome>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMIC_LEVEL_DOMAIN,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_LEVEL_DOMAIN,
        width: { max: "1fr", min: "160px" },
      },
      {
        componentConfig: {
          component: C.BasicCell,
          viewBuilder: V.buildTaxonomicLevelRealm,
        } as ComponentConfig<typeof C.BasicCell, BRCDataCatalogGenome>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMIC_LEVEL_REALM,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_LEVEL_REALM,
        width: { max: "1fr", min: "160px" },
      },
      {
        componentConfig: {
          component: C.BasicCell,
          viewBuilder: V.buildTaxonomicLevelKingdom,
        } as ComponentConfig<typeof C.BasicCell, BRCDataCatalogGenome>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMIC_LEVEL_KINGDOM,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_LEVEL_KINGDOM,
        width: { max: "1fr", min: "160px" },
      },
      {
        componentConfig: {
          component: C.BasicCell,
          viewBuilder: V.buildTaxonomicLevelPhylum,
        } as ComponentConfig<typeof C.BasicCell, BRCDataCatalogGenome>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMIC_LEVEL_PHYLUM,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_LEVEL_PHYLUM,
        width: { max: "1fr", min: "200px" },
      },
      {
        componentConfig: {
          component: C.BasicCell,
          viewBuilder: V.buildTaxonomicLevelClass,
        } as ComponentConfig<typeof C.BasicCell, BRCDataCatalogGenome>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMIC_LEVEL_CLASS,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_LEVEL_CLASS,
        width: { max: "1fr", min: "200px" },
      },
      {
        componentConfig: {
          component: C.BasicCell,
          viewBuilder: V.buildTaxonomicLevelOrder,
        } as ComponentConfig<typeof C.BasicCell, BRCDataCatalogGenome>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMIC_LEVEL_ORDER,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_LEVEL_ORDER,
        width: { max: "1fr", min: "212px" },
      },
      {
        componentConfig: {
          component: C.BasicCell,
          viewBuilder: V.buildTaxonomicLevelFamily,
        } as ComponentConfig<typeof C.BasicCell, BRCDataCatalogGenome>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMIC_LEVEL_FAMILY,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_LEVEL_FAMILY,
        width: { max: "1fr", min: "224px" },
      },
      {
        componentConfig: {
          component: C.BasicCell,
          viewBuilder: V.buildTaxonomicLevelGenus,
        } as ComponentConfig<typeof C.BasicCell, BRCDataCatalogGenome>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMIC_LEVEL_GENUS,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_LEVEL_GENUS,
        width: { max: "1fr", min: "212px" },
      },
      {
        componentConfig: {
          component: C.Link,
          viewBuilder: V.buildGenomeTaxonomicLevelSpecies,
        } as ComponentConfig<typeof C.Link, BRCDataCatalogGenome>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMIC_LEVEL_SPECIES,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_LEVEL_SPECIES,
        width: { max: "1fr", min: "200px" },
      },
      {
        componentConfig: {
          component: C.BasicCell,
          viewBuilder: V.buildGenomeTaxonomicLevelStrain,
        } as ComponentConfig<typeof C.BasicCell, BRCDataCatalogGenome>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMIC_LEVEL_STRAIN,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_LEVEL_STRAIN,
        width: { max: "0.5fr", min: "160px" },
      },
      {
        componentConfig: {
          component: C.BasicCell,
          viewBuilder: V.buildGenomeTaxonomicLevelSerotype,
        } as ComponentConfig<typeof C.BasicCell, BRCDataCatalogGenome>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMIC_LEVEL_SEROTYPE,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_LEVEL_SEROTYPE,
        width: { max: "0.5fr", min: "160px" },
      },
      {
        componentConfig: {
          component: C.BasicCell,
          viewBuilder: V.buildGenomeTaxonomicLevelIsolate,
        } as ComponentConfig<typeof C.BasicCell, BRCDataCatalogGenome>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMIC_LEVEL_ISOLATE,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_LEVEL_ISOLATE,
        width: { max: "0.5fr", min: "160px" },
      },
      {
        componentConfig: {
          component: C.BasicCell,
          viewBuilder: V.buildCommonName,
        } as ComponentConfig<typeof C.BasicCell, BRCDataCatalogGenome>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.COMMON_NAME,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.COMMON_NAME,
        width: { max: "1fr", min: "160px" },
      },
      {
        componentConfig: {
          component: C.BasicCell,
          viewBuilder: V.buildTaxonomyId,
        } as ComponentConfig<typeof C.BasicCell, BRCDataCatalogGenome>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMY_ID,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMY_ID,
        width: { max: "0.5fr", min: "144px" },
      },
      {
        componentConfig: {
          component: C.NTagCell,
          viewBuilder: V.buildTaxonomicGroup,
        } as ComponentConfig<typeof C.NTagCell, BRCDataCatalogGenome>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMIC_GROUP,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_GROUP,
        width: { max: "0.5fr", min: "142px" },
      },
      {
        componentConfig: {
          children: [
            {
              component: C.Chip,
              viewBuilder: V.buildPriorityPathogen,
            } as ComponentConfig<typeof C.Chip, BRCDataCatalogGenome>,
          ],
          component: C.Tooltip,
          viewBuilder: V.buildPriorityPathogenTooltip,
        } as ComponentConfig<typeof C.Tooltip, BRCDataCatalogGenome>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.PRIORITY_PATHOGEN_NAME,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.PRIORITY_PATHOGEN_NAME,
        width: { max: "0.5fr", min: "142px" },
      },
      {
        componentConfig: {
          component: C.ChipCell,
          viewBuilder: V.buildIsRef,
        } as ComponentConfig<typeof C.ChipCell, BRCDataCatalogGenome>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.IS_REF,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.IS_REF,
        width: { max: "0.5fr", min: "100px" },
      },
      {
        componentConfig: {
          component: C.BasicCell,
          viewBuilder: V.buildLevel,
        } as ComponentConfig<typeof C.BasicCell, BRCDataCatalogGenome>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.LEVEL,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.LEVEL,
        width: { max: "0.5fr", min: "142px" },
      },
      {
        componentConfig: {
          component: C.BasicCell,
          viewBuilder: V.buildChromosomes,
        } as ComponentConfig<typeof C.BasicCell, BRCDataCatalogGenome>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.CHROMOSOMES,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.CHROMOSOMES,
        width: { max: "0.5fr", min: "142px" },
      },
      {
        componentConfig: {
          component: C.BasicCell,
          viewBuilder: V.buildLength,
        } as ComponentConfig<typeof C.BasicCell, BRCDataCatalogGenome>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.LENGTH,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.LENGTH,
        width: { max: "0.5fr", min: "132px" },
      },
      {
        componentConfig: {
          component: C.BasicCell,
          viewBuilder: V.buildScaffoldCount,
        } as ComponentConfig<typeof C.BasicCell, BRCDataCatalogGenome>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.SCAFFOLD_COUNT,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.SCAFFOLD_COUNT,
        width: { max: "0.5fr", min: "120px" },
      },
      {
        componentConfig: {
          component: C.BasicCell,
          viewBuilder: V.buildScaffoldN50,
        } as ComponentConfig<typeof C.BasicCell, BRCDataCatalogGenome>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.SCAFFOLD_N50,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.SCAFFOLD_N50,
        width: { max: "0.5fr", min: "120px" },
      },
      {
        componentConfig: {
          component: C.BasicCell,
          viewBuilder: V.buildScaffoldL50,
        } as ComponentConfig<typeof C.BasicCell, BRCDataCatalogGenome>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.SCAFFOLD_L50,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.SCAFFOLD_L50,
        width: { max: "0.5fr", min: "120px" },
      },
      {
        componentConfig: {
          component: C.BasicCell,
          viewBuilder: V.buildCoverage,
        } as ComponentConfig<typeof C.BasicCell, BRCDataCatalogGenome>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.COVERAGE,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.COVERAGE,
        width: { max: "0.5fr", min: "100px" },
      },
      {
        componentConfig: {
          component: C.BasicCell,
          viewBuilder: V.buildGcPercent,
        } as ComponentConfig<typeof C.BasicCell, BRCDataCatalogGenome>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.GC_PERCENT,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.GC_PERCENT,
        width: { max: "0.5fr", min: "100px" },
      },
      {
        componentConfig: {
          component: C.BasicCell,
          viewBuilder: V.buildAnnotationStatus,
        } as ComponentConfig<typeof C.BasicCell, BRCDataCatalogGenome>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.ANNOTATION_STATUS,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.ANNOTATION_STATUS,
        width: { max: "0.5fr", min: "180px" },
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
  } as ListConfig<BRCDataCatalogGenome>,
  listView: {
    disablePagination: true,
    enableDownload: true,
  },
  route: "assemblies",
  staticLoadFile: "catalog/output/assemblies.json",
  ui: { title: "Assemblies" },
};
