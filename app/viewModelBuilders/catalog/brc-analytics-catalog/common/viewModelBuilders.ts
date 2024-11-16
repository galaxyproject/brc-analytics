import { Breadcrumb } from "@databiosphere/findable-ui/lib/components/common/Breadcrumbs/breadcrumbs";
import {
  Key,
  Value,
} from "@databiosphere/findable-ui/lib/components/common/KeyValuePairs/keyValuePairs";
import { ViewContext } from "@databiosphere/findable-ui/lib/config/entities";
import { ComponentProps } from "react";
import { ROUTES } from "../../../../../routes/constants";
import { BRCDataCatalogGenome } from "../../../../apis/catalog/brc-analytics-catalog/common/entities";
import * as C from "../../../../components";
import { GENOME_BROWSER, NCBI_DATASETS_URL } from "./constants";

/**
 * Build props for the accession cell.
 * @param genome - Genome entity.
 * @returns Props to be used for the cell.
 */
export const buildAccession = (
  genome: BRCDataCatalogGenome
): ComponentProps<typeof C.BasicCell> => {
  return {
    value: genome.accession,
  };
};

/**
 * Build props for the genome analysis cell.
 * @param genome - Genome entity.
 * @param viewContext - View context.
 * @returns Props to be used for the AnalyzeGenome component.
 */
export const buildAnalyzeGenome = (
  genome: BRCDataCatalogGenome,
  viewContext: ViewContext<BRCDataCatalogGenome>
): ComponentProps<typeof C.AnalyzeGenome> => {
  const { accession, ncbiTaxonomyId, ucscBrowserUrl } = genome;
  const rowId = viewContext.cellContext?.row?.id;
  return {
    analyze: {
      label: "Analyze",
      url: rowId ? `${ROUTES.ORGANISMS}/${rowId}` : "",
    },
    views: [
      ...(ucscBrowserUrl
        ? [{ label: "UCSC Genome Browser", url: ucscBrowserUrl }]
        : []),
      {
        label: "NCBI Genome Assembly",
        url: `${NCBI_DATASETS_URL}/genome/${accession}`,
      },
      {
        label: "NCBI Taxonomy",
        url: `${NCBI_DATASETS_URL}/taxonomy/${encodeURIComponent(
          ncbiTaxonomyId
        )}`,
      },
    ],
  };
};

/**
 * Build props for the annotation status cell.
 * @param genome - Genome entity.
 * @returns Props to be used for the cell.
 */
export const buildAnnotationStatus = (
  genome: BRCDataCatalogGenome
): ComponentProps<typeof C.BasicCell> => {
  return {
    value: genome.annotationStatus,
  };
};

/**
 * Build props for the chromosomes cell.
 * @param genome - Genome entity.
 * @returns Props to be used for the cell.
 */
export const buildChromosomes = (
  genome: BRCDataCatalogGenome
): ComponentProps<typeof C.BasicCell> => {
  return {
    value: genome.chromosomes,
  };
};

/**
 * Build props for the coverage cell.
 * @param genome - Genome entity.
 * @returns Props to be used for the cell.
 */
export const buildCoverage = (
  genome: BRCDataCatalogGenome
): ComponentProps<typeof C.BasicCell> => {
  return {
    value: genome.coverage,
  };
};

/**
 * Build props for the GC% cell.
 * @param genome - Genome entity.
 * @returns Props to be used for the cell.
 */
export const buildGcPercent = (
  genome: BRCDataCatalogGenome
): ComponentProps<typeof C.BasicCell> => {
  return {
    value: genome.gcPercent,
  };
};

/**
 * Build props for the "is ref" cell.
 * @param genome - Genome entity.
 * @returns Props to be used for the cell.
 */
export const buildIsRef = (
  genome: BRCDataCatalogGenome
): ComponentProps<typeof C.BasicCell> => {
  return {
    value: genome.isRef ? "Yes" : "No",
  };
};

/**
 * Build props for the length cell.
 * @param genome - Genome entity.
 * @returns Props to be used for the cell.
 */
export const buildLength = (
  genome: BRCDataCatalogGenome
): ComponentProps<typeof C.BasicCell> => {
  return {
    value: genome.length,
  };
};

/**
 * Build props for the level cell.
 * @param genome - Genome entity.
 * @returns Props to be used for the cell.
 */
export const buildLevel = (
  genome: BRCDataCatalogGenome
): ComponentProps<typeof C.BasicCell> => {
  return {
    value: genome.level,
  };
};

/**
 * Build props for the organism cell.
 * @param genome - Genome entity.
 * @returns Props to be used for the cell.
 */
export const buildOrganism = (
  genome: BRCDataCatalogGenome
): ComponentProps<typeof C.BasicCell> => {
  return {
    value: genome.organism,
  };
};

/**
 * Build props for the scaffold count cell.
 * @param genome - Genome entity.
 * @returns Props to be used for the cell.
 */
export const buildScaffoldCount = (
  genome: BRCDataCatalogGenome
): ComponentProps<typeof C.BasicCell> => {
  return {
    value: genome.scaffoldCount,
  };
};

/**
 * Build props for the scaffold L50 cell.
 * @param genome - Genome entity.
 * @returns Props to be used for the cell.
 */
export const buildScaffoldL50 = (
  genome: BRCDataCatalogGenome
): ComponentProps<typeof C.BasicCell> => {
  return {
    value: genome.scaffoldL50,
  };
};

/**
 * Build props for the scaffold N50 cell.
 * @param genome - Genome entity.
 * @returns Props to be used for the cell.
 */
export const buildScaffoldN50 = (
  genome: BRCDataCatalogGenome
): ComponentProps<typeof C.BasicCell> => {
  return {
    value: genome.scaffoldN50,
  };
};

/**
 * Build props for the taxonomy ID cell.
 * @param genome - Genome entity.
 * @returns Props to be used for the cell.
 */
export const buildTaxonomyId = (
  genome: BRCDataCatalogGenome
): ComponentProps<typeof C.BasicCell> => {
  return {
    value: genome.ncbiTaxonomyId,
  };
};

/**
 * Build props for the genome AnalysisMethod component.
 * @param genome - Genome entity.
 * @param analysisMethodProps - Analysis Method properties.
 * @param analysisMethodProps.analysisMethod - Analysis method.
 * @param analysisMethodProps.content - Content to be displayed.
 * @returns Props to be used for the AnalysisMethod component.
 */
export const buildGenomeAnalysisMethod = (
  genome: BRCDataCatalogGenome,
  analysisMethodProps: Pick<
    ComponentProps<typeof C.AnalysisMethod>,
    "analysisMethod" | "content"
  >
): ComponentProps<typeof C.AnalysisMethod> => {
  return {
    ...analysisMethodProps,
    geneModelUrl: "",
    genomeVersionAssemblyId: genome.accession,
  };
};

/**
 * Build props for the genome AnalysisPortals component.
 * @param genome - Genome entity.
 * @returns Props to be used for the AnalysisPortals component.
 */
export const buildGenomeAnalysisPortals = (
  genome: BRCDataCatalogGenome
): ComponentProps<typeof C.AnalysisPortals> => {
  return {
    portals: genome.ucscBrowserUrl
      ? [
          {
            imageProps: {
              alt: GENOME_BROWSER,
              src: "/analysis-portals/ucsc-genome.png",
              width: 20,
            },
            label: GENOME_BROWSER,
            url: genome.ucscBrowserUrl,
          },
        ]
      : [],
  };
};

/**
 * Build props for the genome DetailViewHero component.
 * @param genome - Genome entity.
 * @returns Props to be used for the DetailViewHero component.
 */
export const buildGenomeChooseAnalysisMethodDetailViewHero = (
  genome: BRCDataCatalogGenome
): ComponentProps<typeof C.DetailViewHero> => {
  return {
    breadcrumbs: C.Breadcrumbs({
      breadcrumbs: getGenomeEntityChooseAnalysisMethodBreadcrumbs(genome),
    }),
    title: "Choose Analysis Methods",
  };
};

/**
 * Build props for the genome detail KeyValuePairs component.
 * @param genome - Genome entity.
 * @returns Props to be used for the KeyValuePairs component.
 */
export const buildGenomeDetails = (
  genome: BRCDataCatalogGenome
): ComponentProps<typeof C.KeyValuePairs> => {
  const keyValuePairs = new Map<Key, Value>();
  keyValuePairs.set(
    "Taxon",
    C.Link({
      label: genome.organism,
      url: `https://www.ncbi.nlm.nih.gov/datasets/taxonomy/${encodeURIComponent(
        genome.ncbiTaxonomyId
      )}/`,
    })
  );
  keyValuePairs.set(
    "Accession",
    C.CopyText({
      children: genome.accession,
      value: genome.accession,
    })
  );
  keyValuePairs.set("Chromosomes", genome.chromosomes);
  return {
    KeyElType: C.KeyElType,
    KeyValuesElType: (props) => C.Stack({ gap: 4, ...props }),
    ValueElType: C.ValueElType,
    keyValuePairs,
  };
};

/**
 * Get the genome entity breadcrumbs.
 * @param genome - Genome entity.
 * @returns Breadcrumbs.
 */
function getGenomeEntityChooseAnalysisMethodBreadcrumbs(
  genome: BRCDataCatalogGenome
): Breadcrumb[] {
  return [
    { path: ROUTES.ORGANISMS, text: "Organisms" },
    { path: "", text: `${genome.organism}` },
    { path: "", text: "Choose Analysis Methods" },
  ];
}
