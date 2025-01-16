import { Breadcrumb } from "@databiosphere/findable-ui/lib/components/common/Breadcrumbs/breadcrumbs";
import {
  Key,
  Value,
} from "@databiosphere/findable-ui/lib/components/common/KeyValuePairs/keyValuePairs";
import { ComponentProps } from "react";
import { ROUTES } from "../../../../../routes/constants";
import {
  BRCDataCatalogGenome,
  BRCDataCatalogOrganism,
} from "../../../../apis/catalog/brc-analytics-catalog/common/entities";
import * as C from "../../../../components";
import { GENOME_BROWSER, NCBI_DATASETS_URL } from "./constants";
import { ColumnDef } from "@tanstack/react-table";
import {
  BRC_DATA_CATALOG_CATEGORY_KEY,
  BRC_DATA_CATALOG_CATEGORY_LABEL,
} from "site-config/brc-analytics/category";
import {
  getGenomeId,
  getOrganismId,
} from "../../../../apis/catalog/brc-analytics-catalog/common/utils";
import { COLUMN_IDENTIFIER } from "@databiosphere/findable-ui/lib/components/Table/common/columnIdentifier";

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
 * @returns Props to be used for the AnalyzeGenome component.
 */
export const buildAnalyzeGenome = (
  genome: BRCDataCatalogGenome
): ComponentProps<typeof C.AnalyzeGenome> => {
  const { accession, ncbiTaxonomyId, ucscBrowserUrl } = genome;
  return {
    analyze: {
      label: "Analyze",
      url: `${ROUTES.GENOMES}/${encodeURIComponent(getGenomeId(genome))}`,
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
 * Build props for the assemblies cell.
 * @param organism - Genome entity.
 * @returns Props to be used for the cell.
 */
export const buildAssemblyCount = (
  organism: BRCDataCatalogOrganism
): ComponentProps<typeof C.BasicCell> => {
  return {
    value: organism.assemblyCount,
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
 * Build props for the taxon cell.
 * @param genome - Genome entity.
 * @returns Props to be used for the cell.
 */
export const buildGenomeTaxon = (
  genome: BRCDataCatalogGenome
): ComponentProps<typeof C.BasicCell> => {
  return {
    value: genome.taxon,
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
    value: genome.isRef,
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
 * Build props for the taxon cell.
 * @param organism - Organism entity.
 * @returns Props to be used for the cell.
 */
export const buildOrganismTaxon = (
  organism: BRCDataCatalogOrganism
): ComponentProps<typeof C.Link> => {
  return {
    label: organism.taxon,
    url: `${ROUTES.ORGANISMS}/${encodeURIComponent(getOrganismId(organism))}`,
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
 * Build props for the strain cell.
 * @param genome - Genome entity.
 * @returns Props to be used for the cell.
 */
export const buildStrain = (
  genome: BRCDataCatalogGenome
): ComponentProps<typeof C.BasicCell> => {
  return {
    value: genome.strain,
  };
};

/**
 * Build props for the taxonomy ID cell.
 * @param genome - Genome entity.
 * @returns Props to be used for the cell.
 */
export const buildTaxonomyId = (
  genome: BRCDataCatalogOrganism | BRCDataCatalogGenome
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
    geneModelUrl: genome.geneModelUrl,
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
      label: genome.taxon,
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
 * Build props for the organism DetailViewHero component.
 * @param organism - Organism entity.
 * @returns Props to be used for the DetailViewHero component.
 */
export const buildOrganismAssembliesDetailViewHero = (
  organism: BRCDataCatalogOrganism
): ComponentProps<typeof C.DetailViewHero> => {
  return {
    breadcrumbs: C.Breadcrumbs({
      breadcrumbs: getOrganismEntityAssembliesBreadcrumbs(organism),
    }),
    title: "Assemblies",
  };
};

/**
 * Build props for the genomes table for the given organism.
 * @param organism - Organism entity.
 * @returns props to be used for the table.
 */
export function buildOrganismGenomesTable(
  organism: BRCDataCatalogOrganism
): ComponentProps<typeof C.DetailViewTable<BRCDataCatalogGenome>> {
  return {
    columns: buildOrganismGenomesTableColumns(),
    gridTemplateColumns:
      "auto minmax(164px, 1fr) minmax(240px, 1fr) minmax(180px, 0.5fr) minmax(100px, 0.5fr) minmax(100px, 0.5fr) repeat(2, minmax(142px, 0.5fr)) minmax(120px, 0.5fr) minmax(80px, 0.5fr) minmax(142px, 0.5fr) repeat(3, minmax(80px, 0.5fr)) minmax(142px, 0.5fr)",
    items: organism.genomes,
    noResultsTitle: "No Assemblies",
    tableOptions: {
      enableRowPosition: false,
      initialState: {
        columnVisibility: { [COLUMN_IDENTIFIER.ROW_POSITION]: false },
      },
    },
  };
}

/**
 * Build the column definitions for the organism genomes table.
 * @returns column definitions.
 */
function buildOrganismGenomesTableColumns(): ColumnDef<BRCDataCatalogGenome>[] {
  return [
    {
      accessorKey: BRC_DATA_CATALOG_CATEGORY_KEY.ANALYZE_GENOME,
      cell: ({ row }) => C.AnalyzeGenome(buildAnalyzeGenome(row.original)),
      header: BRC_DATA_CATALOG_CATEGORY_LABEL.ANALYZE_GENOME,
    },
    {
      accessorKey: BRC_DATA_CATALOG_CATEGORY_KEY.ACCESSION,
      cell: ({ row }) => C.BasicCell(buildAccession(row.original)),
      header: BRC_DATA_CATALOG_CATEGORY_LABEL.ACCESSION,
    },
    {
      accessorKey: BRC_DATA_CATALOG_CATEGORY_KEY.TAXON,
      cell: ({ row }) => C.BasicCell(buildGenomeTaxon(row.original)),
      header: BRC_DATA_CATALOG_CATEGORY_LABEL.TAXON,
    },
    {
      accessorKey: BRC_DATA_CATALOG_CATEGORY_KEY.STRAIN,
      cell: ({ row }) => C.BasicCell(buildStrain(row.original)),
      header: BRC_DATA_CATALOG_CATEGORY_LABEL.STRAIN,
    },
    {
      accessorKey: BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMY_ID,
      cell: ({ row }) => C.BasicCell(buildTaxonomyId(row.original)),
      header: BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMY_ID,
    },
    {
      accessorKey: BRC_DATA_CATALOG_CATEGORY_KEY.IS_REF,
      cell: ({ row }) => C.BasicCell(buildIsRef(row.original)),
      header: BRC_DATA_CATALOG_CATEGORY_LABEL.IS_REF,
    },
    {
      accessorKey: BRC_DATA_CATALOG_CATEGORY_KEY.LEVEL,
      cell: ({ row }) => C.BasicCell(buildLevel(row.original)),
      header: BRC_DATA_CATALOG_CATEGORY_LABEL.LEVEL,
    },
    {
      accessorKey: BRC_DATA_CATALOG_CATEGORY_KEY.CHROMOSOMES,
      cell: ({ row }) => C.BasicCell(buildChromosomes(row.original)),
      header: BRC_DATA_CATALOG_CATEGORY_LABEL.CHROMOSOMES,
    },
    {
      accessorKey: BRC_DATA_CATALOG_CATEGORY_KEY.LENGTH,
      cell: ({ row }) => C.BasicCell(buildLength(row.original)),
      header: BRC_DATA_CATALOG_CATEGORY_LABEL.LENGTH,
    },
    {
      accessorKey: BRC_DATA_CATALOG_CATEGORY_KEY.SCAFFOLD_COUNT,
      cell: ({ row }) => C.BasicCell(buildScaffoldCount(row.original)),
      header: BRC_DATA_CATALOG_CATEGORY_LABEL.SCAFFOLD_COUNT,
    },
    {
      accessorKey: BRC_DATA_CATALOG_CATEGORY_KEY.SCAFFOLD_N50,
      cell: ({ row }) => C.BasicCell(buildScaffoldN50(row.original)),
      header: BRC_DATA_CATALOG_CATEGORY_LABEL.SCAFFOLD_N50,
    },
    {
      accessorKey: BRC_DATA_CATALOG_CATEGORY_KEY.SCAFFOLD_L50,
      cell: ({ row }) => C.BasicCell(buildScaffoldL50(row.original)),
      header: BRC_DATA_CATALOG_CATEGORY_LABEL.SCAFFOLD_L50,
    },
    {
      accessorKey: BRC_DATA_CATALOG_CATEGORY_KEY.COVERAGE,
      cell: ({ row }) => C.BasicCell(buildCoverage(row.original)),
      header: BRC_DATA_CATALOG_CATEGORY_LABEL.COVERAGE,
    },
    {
      accessorKey: BRC_DATA_CATALOG_CATEGORY_KEY.GC_PERCENT,
      cell: ({ row }) => C.BasicCell(buildGcPercent(row.original)),
      header: BRC_DATA_CATALOG_CATEGORY_LABEL.GC_PERCENT,
    },
    {
      accessorKey: BRC_DATA_CATALOG_CATEGORY_KEY.ANNOTATION_STATUS,
      cell: ({ row }) => C.BasicCell(buildAnnotationStatus(row.original)),
      header: BRC_DATA_CATALOG_CATEGORY_LABEL.ANNOTATION_STATUS,
    },
  ];
}

/**
 * Get the genome entity breadcrumbs.
 * @param genome - Genome entity.
 * @returns Breadcrumbs.
 */
function getGenomeEntityChooseAnalysisMethodBreadcrumbs(
  genome: BRCDataCatalogGenome
): Breadcrumb[] {
  return [
    { path: ROUTES.GENOMES, text: "Assemblies" },
    { path: "", text: `${genome.taxon}` },
    { path: "", text: "Choose Analysis Methods" },
  ];
}

/**
 * Get the organism entity breadcrumbs.
 * @param organism - Organism entity.
 * @returns Breadcrumbs.
 */
function getOrganismEntityAssembliesBreadcrumbs(
  organism: BRCDataCatalogOrganism
): Breadcrumb[] {
  return [
    { path: ROUTES.ORGANISMS, text: "Organisms" },
    { path: "", text: `${organism.taxon}` },
    { path: "", text: "Assemblies" },
  ];
}
