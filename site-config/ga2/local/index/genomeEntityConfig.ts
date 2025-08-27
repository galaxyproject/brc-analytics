import {
  ComponentConfig,
  ListConfig,
  SORT_DIRECTION,
} from "@databiosphere/findable-ui/lib/config/entities";
import { EXPLORE_MODE } from "@databiosphere/findable-ui/lib/hooks/useExploreMode/types";
import * as C from "../../../../app/components";
import {
  buildAccession,
  buildAnalyzeGenome,
  buildAnnotationStatus,
  buildChromosomes,
  buildCoverage,
  buildGcPercent,
  buildIsRef,
  buildLength,
  buildLevel,
  buildScaffoldCount,
  buildScaffoldL50,
  buildScaffoldN50,
  buildTaxonomicGroup,
  buildTaxonomyId,
} from "../../../../app/viewModelBuilders/catalog/brc-analytics-catalog/common/viewModelBuilders";
import { AppEntityConfig } from "../../../common/entities";
import { GA2_CATEGORY_KEY, GA2_CATEGORY_LABEL } from "../../category";
import { mainColumn as analysisMethodsMainColumn } from "../entity/genome/analysisMethodMainColumn";
import { sideColumn as analysisMethodsSideColumn } from "../entity/genome/analysisMethodsSideColumn";
import { top as analysisMethodsTop } from "../entity/genome/analysisMethodsTop";
import { GA2AssemblyEntity } from "../../../../app/apis/catalog/ga2/entities";
import {
  getAssemblyId,
  getAssemblyTitle,
} from "../../../../app/apis/catalog/ga2/utils";
import * as V from "../../../../app/viewModelBuilders/catalog/ga2/viewModelBuilders";

/**
 * Entity config object responsible to config anything related to the /assemblies route.
 */
export const genomeEntityConfig: AppEntityConfig<GA2AssemblyEntity> = {
  categoryGroupConfig: {
    categoryGroups: [
      {
        categoryConfigs: [
          {
            key: GA2_CATEGORY_KEY.SPECIES,
            label: GA2_CATEGORY_LABEL.SPECIES,
          },
          {
            key: GA2_CATEGORY_KEY.STRAIN,
            label: GA2_CATEGORY_LABEL.STRAIN,
          },
          {
            key: GA2_CATEGORY_KEY.TAXONOMY_ID,
            label: GA2_CATEGORY_LABEL.TAXONOMY_ID,
          },
        ],
        label: "Organism",
      },
      {
        categoryConfigs: [
          {
            key: GA2_CATEGORY_KEY.ACCESSION,
            label: GA2_CATEGORY_LABEL.ACCESSION,
          },
          {
            key: GA2_CATEGORY_KEY.IS_REF,
            label: GA2_CATEGORY_LABEL.IS_REF,
          },
          {
            key: GA2_CATEGORY_KEY.LEVEL,
            label: GA2_CATEGORY_LABEL.LEVEL,
          },
          {
            key: GA2_CATEGORY_KEY.COVERAGE,
            label: GA2_CATEGORY_LABEL.COVERAGE,
          },
          {
            key: GA2_CATEGORY_KEY.ANNOTATION_STATUS,
            label: GA2_CATEGORY_LABEL.ANNOTATION_STATUS,
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
  getId: getAssemblyId,
  getTitle: getAssemblyTitle,
  label: "Assemblies",
  list: {
    columns: [
      {
        componentConfig: {
          component: C.AnalyzeGenome,
          viewBuilder: buildAnalyzeGenome,
        } as ComponentConfig<typeof C.AnalyzeGenome, GA2AssemblyEntity>,
        enableSorting: false,
        header: GA2_CATEGORY_LABEL.ANALYZE_GENOME,
        id: GA2_CATEGORY_KEY.ANALYZE_GENOME,
        width: "auto",
      },
      {
        columnPinned: true,
        componentConfig: {
          component: C.BasicCell,
          viewBuilder: buildAccession,
        } as ComponentConfig<typeof C.BasicCell, GA2AssemblyEntity>,
        header: GA2_CATEGORY_LABEL.ACCESSION,
        id: GA2_CATEGORY_KEY.ACCESSION,
        width: { max: "1fr", min: "164px" },
      },
      {
        componentConfig: {
          component: C.Link,
          viewBuilder: V.buildSpecies,
        } as ComponentConfig<typeof C.Link, GA2AssemblyEntity>,
        header: GA2_CATEGORY_LABEL.SPECIES,
        id: GA2_CATEGORY_KEY.SPECIES,
        width: { max: "1fr", min: "200px" },
      },
      {
        componentConfig: {
          component: C.BasicCell,
          viewBuilder: V.buildStrain,
        } as ComponentConfig<typeof C.BasicCell, GA2AssemblyEntity>,
        header: GA2_CATEGORY_LABEL.STRAIN,
        id: GA2_CATEGORY_KEY.STRAIN,
        width: { max: "0.5fr", min: "160px" },
      },
      {
        componentConfig: {
          component: C.BasicCell,
          viewBuilder: buildTaxonomyId,
        } as ComponentConfig<typeof C.BasicCell, GA2AssemblyEntity>,
        header: GA2_CATEGORY_LABEL.TAXONOMY_ID,
        id: GA2_CATEGORY_KEY.TAXONOMY_ID,
        width: { max: "0.5fr", min: "144px" },
      },
      {
        componentConfig: {
          component: C.NTagCell,
          viewBuilder: buildTaxonomicGroup,
        } as ComponentConfig<typeof C.NTagCell, GA2AssemblyEntity>,
        header: GA2_CATEGORY_LABEL.TAXONOMIC_GROUP,
        id: GA2_CATEGORY_KEY.TAXONOMIC_GROUP,
        width: { max: "0.5fr", min: "142px" },
      },
      {
        componentConfig: {
          component: C.ChipCell,
          viewBuilder: buildIsRef,
        } as ComponentConfig<typeof C.ChipCell, GA2AssemblyEntity>,
        header: GA2_CATEGORY_LABEL.IS_REF,
        id: GA2_CATEGORY_KEY.IS_REF,
        width: { max: "0.5fr", min: "100px" },
      },
      {
        componentConfig: {
          component: C.BasicCell,
          viewBuilder: buildLevel,
        } as ComponentConfig<typeof C.BasicCell, GA2AssemblyEntity>,
        header: GA2_CATEGORY_LABEL.LEVEL,
        id: GA2_CATEGORY_KEY.LEVEL,
        width: { max: "0.5fr", min: "142px" },
      },
      {
        componentConfig: {
          component: C.BasicCell,
          viewBuilder: buildChromosomes,
        } as ComponentConfig<typeof C.BasicCell, GA2AssemblyEntity>,
        header: GA2_CATEGORY_LABEL.CHROMOSOMES,
        id: GA2_CATEGORY_KEY.CHROMOSOMES,
        width: { max: "0.5fr", min: "142px" },
      },
      {
        componentConfig: {
          component: C.BasicCell,
          viewBuilder: buildLength,
        } as ComponentConfig<typeof C.BasicCell, GA2AssemblyEntity>,
        header: GA2_CATEGORY_LABEL.LENGTH,
        id: GA2_CATEGORY_KEY.LENGTH,
        width: { max: "0.5fr", min: "132px" },
      },
      {
        componentConfig: {
          component: C.BasicCell,
          viewBuilder: buildScaffoldCount,
        } as ComponentConfig<typeof C.BasicCell, GA2AssemblyEntity>,
        header: GA2_CATEGORY_LABEL.SCAFFOLD_COUNT,
        id: GA2_CATEGORY_KEY.SCAFFOLD_COUNT,
        width: { max: "0.5fr", min: "120px" },
      },
      {
        componentConfig: {
          component: C.BasicCell,
          viewBuilder: buildScaffoldN50,
        } as ComponentConfig<typeof C.BasicCell, GA2AssemblyEntity>,
        header: GA2_CATEGORY_LABEL.SCAFFOLD_N50,
        id: GA2_CATEGORY_KEY.SCAFFOLD_N50,
        width: { max: "0.5fr", min: "120px" },
      },
      {
        componentConfig: {
          component: C.BasicCell,
          viewBuilder: buildScaffoldL50,
        } as ComponentConfig<typeof C.BasicCell, GA2AssemblyEntity>,
        header: GA2_CATEGORY_LABEL.SCAFFOLD_L50,
        id: GA2_CATEGORY_KEY.SCAFFOLD_L50,
        width: { max: "0.5fr", min: "120px" },
      },
      {
        componentConfig: {
          component: C.BasicCell,
          viewBuilder: buildCoverage,
        } as ComponentConfig<typeof C.BasicCell, GA2AssemblyEntity>,
        header: GA2_CATEGORY_LABEL.COVERAGE,
        id: GA2_CATEGORY_KEY.COVERAGE,
        width: { max: "0.5fr", min: "100px" },
      },
      {
        componentConfig: {
          component: C.BasicCell,
          viewBuilder: buildGcPercent,
        } as ComponentConfig<typeof C.BasicCell, GA2AssemblyEntity>,
        header: GA2_CATEGORY_LABEL.GC_PERCENT,
        id: GA2_CATEGORY_KEY.GC_PERCENT,
        width: { max: "0.5fr", min: "100px" },
      },
      {
        componentConfig: {
          component: C.BasicCell,
          viewBuilder: buildAnnotationStatus,
        } as ComponentConfig<typeof C.BasicCell, GA2AssemblyEntity>,
        header: GA2_CATEGORY_LABEL.ANNOTATION_STATUS,
        id: GA2_CATEGORY_KEY.ANNOTATION_STATUS,
        width: { max: "0.5fr", min: "180px" },
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
  } as ListConfig<GA2AssemblyEntity>,
  listView: {
    disablePagination: true,
    enableDownload: true,
  },
  route: "assemblies",
  staticLoadFile: "catalog/output/assemblies.json",
  ui: { title: "Assemblies" },
};
