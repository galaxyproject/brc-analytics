import {
  ComponentConfig,
  ListConfig,
  SORT_DIRECTION,
} from "@databiosphere/findable-ui/lib/config/entities";
import { EXPLORE_MODE } from "@databiosphere/findable-ui/lib/hooks/useExploreMode";
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
import { listHero } from "../listView/listHero";

/**
 * Entity config object responsible to config anything related to the /genomes route.
 */
export const genomeEntityConfig: BRCEntityConfig<BRCDataCatalogGenome> = {
  categoryGroupConfig: {
    categoryGroups: [
      {
        categoryConfigs: [
          {
            key: BRC_DATA_CATALOG_CATEGORY_KEY.SPECIES,
            label: BRC_DATA_CATALOG_CATEGORY_LABEL.SPECIES,
          },
          {
            key: BRC_DATA_CATALOG_CATEGORY_KEY.STRAIN,
            label: BRC_DATA_CATALOG_CATEGORY_LABEL.STRAIN,
          },
          {
            key: BRC_DATA_CATALOG_CATEGORY_KEY.GENOME_VERSION_ASSEMBLY_ID,
            label: BRC_DATA_CATALOG_CATEGORY_LABEL.GENOME_VERSION_ASSEMBLY_ID,
          },
          {
            key: BRC_DATA_CATALOG_CATEGORY_KEY.VEUPATHDB_PROJECT,
            label: BRC_DATA_CATALOG_CATEGORY_LABEL.VEUPATHDB_PROJECT,
          },
        ],
      },
    ],
    key: "genomes",
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
  explorerTitle: "Organisms",
  getId: getGenomeId,
  getTitle: getGenomeTitle,
  label: "Organisms",
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
        componentConfig: {
          component: C.BasicCell,
          viewBuilder: V.buildSpecies,
        } as ComponentConfig<typeof C.BasicCell, BRCDataCatalogGenome>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.SPECIES,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.SPECIES,
        width: { max: "1fr", min: "284px" },
      },
      {
        componentConfig: {
          component: C.BasicCell,
          viewBuilder: V.buildStrain,
        } as ComponentConfig<typeof C.BasicCell, BRCDataCatalogGenome>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.STRAIN,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.STRAIN,
        width: { max: "1fr", min: "124px" },
      },
      {
        columnPinned: true,
        componentConfig: {
          component: C.BasicCell,
          viewBuilder: V.buildGenomeVersionAssemblyId,
        } as ComponentConfig<typeof C.BasicCell, BRCDataCatalogGenome>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.GENOME_VERSION_ASSEMBLY_ID,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.GENOME_VERSION_ASSEMBLY_ID,
        width: { max: "1fr", min: "164px" },
      },
      {
        componentConfig: {
          component: C.BasicCell,
          viewBuilder: V.buildVEuPathDBProject,
        } as ComponentConfig<typeof C.BasicCell, BRCDataCatalogGenome>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.VEUPATHDB_PROJECT,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.VEUPATHDB_PROJECT,
        width: { max: "1fr", min: "140px" },
      },
      {
        componentConfig: {
          component: C.BasicCell,
          viewBuilder: V.buildContigs,
        } as ComponentConfig<typeof C.BasicCell, BRCDataCatalogGenome>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.CONTIGS,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.CONTIGS,
        width: { max: "0.5fr", min: "100px" },
      },
      {
        componentConfig: {
          component: C.BasicCell,
          viewBuilder: V.buildSupercontigs,
        } as ComponentConfig<typeof C.BasicCell, BRCDataCatalogGenome>,
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.SUPERCONTIGS,
        id: BRC_DATA_CATALOG_CATEGORY_KEY.SUPERCONTIGS,
        width: { max: "0.5fr", min: "140px" },
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
    ],
    tableOptions: {
      initialState: {
        columnVisibility: {},
        sorting: [
          {
            desc: SORT_DIRECTION.ASCENDING,
            id: BRC_DATA_CATALOG_CATEGORY_KEY.SPECIES,
          },
        ],
      },
    },
  } as ListConfig<BRCDataCatalogGenome>,
  listView: {
    disablePagination: true,
    enableDownload: true,
    enableTab: false,
    listHero,
  },
  route: "organisms",
  staticLoadFile: "files/out/genomes.json",
};
