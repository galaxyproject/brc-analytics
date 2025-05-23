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
  Workflow,
} from "../../../../apis/catalog/brc-analytics-catalog/common/entities";
import * as C from "../../../../components";
import { STEPS as WORKFLOW_STEPS } from "../../../../components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/constants";
import {
  GENOME_BROWSER,
  NCBI_ASSEMBLY,
  NCBI_DATASETS_URL,
  NCBI_TAXONOMY,
} from "./constants";
import { ColumnDef } from "@tanstack/react-table";
import {
  BRC_DATA_CATALOG_CATEGORY_KEY,
  BRC_DATA_CATALOG_CATEGORY_LABEL,
} from "site-config/brc-analytics/category";
import {
  getGenomeId,
  getGenomeOrganismId,
  getOrganismId,
} from "../../../../apis/catalog/brc-analytics-catalog/common/utils";
import { COLUMN_IDENTIFIER } from "@databiosphere/findable-ui/lib/components/Table/common/columnIdentifier";
import { ConfiguredInput } from "../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";

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
 * Build props for the assembly BackPageHero component.
 * @param assembly - Assembly entity.
 * @returns Props to be used for the BackPageHero component.
 */
export const buildAssemblyBackPageHero = (
  assembly: BRCDataCatalogGenome
): ComponentProps<typeof C.BackPageHero> => {
  return {
    breadcrumbs: getAssemblyBreadcrumbs(assembly),
    title: "Select a Workflow",
  };
};

/**
 * Build props for the assembly details KeyValuePairs component.
 * @param assembly - Assembly entity.
 * @returns Props to be used for the KeyValuePairs component.
 */
export const buildAssemblyDetails = (
  assembly: BRCDataCatalogGenome
): ComponentProps<typeof C.KeyValuePairs> => {
  const keyValuePairs = new Map<Key, Value>();
  keyValuePairs.set(
    BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMIC_LEVEL_SPECIES,
    C.Link({
      label: assembly.taxonomicLevelSpecies,
      url: `${ROUTES.ORGANISMS}/${encodeURIComponent(getGenomeOrganismId(assembly))}`,
    })
  );
  const strain = getGenomeStrainText(assembly);
  if (strain) {
    keyValuePairs.set(
      BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMIC_LEVEL_STRAIN,
      strain
    );
  }
  keyValuePairs.set(
    BRC_DATA_CATALOG_CATEGORY_LABEL.ACCESSION,
    C.CopyText({
      children: assembly.accession,
      value: assembly.accession,
    })
  );
  return {
    KeyElType: C.KeyElType,
    KeyValuesElType: (props) => C.Stack({ ...props, gap: 4 }),
    ValueElType: C.ValueElType,
    keyValuePairs,
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
 * Build props for the common name cell.
 * @param entity - Organism or genome entity.
 * @returns Props to be used for the cell.
 */
export const buildCommonName = (
  entity: BRCDataCatalogOrganism | BRCDataCatalogGenome
): ComponentProps<typeof C.BasicCell> => {
  return {
    value: entity.commonName,
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
 * Build props for the species cell.
 * @param genome - Genome entity.
 * @returns Props to be used for the cell.
 */
export const buildGenomeTaxonomicLevelSpecies = (
  genome: BRCDataCatalogGenome
): ComponentProps<typeof C.Link> => {
  return {
    label: genome.taxonomicLevelSpecies,
    url: `${ROUTES.ORGANISMS}/${encodeURIComponent(getGenomeOrganismId(genome))}`,
  };
};

/**
 * Build props for the strain cell.
 * @param genome - Genome entity.
 * @returns Props to be used for the cell.
 */
export const buildGenomeTaxonomicLevelStrain = (
  genome: BRCDataCatalogGenome
): ComponentProps<typeof C.BasicCell> => {
  return {
    value: getGenomeStrainText(genome),
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
 * Build props for the assembly taxonomy IDs cell.
 * @param organism - Organism entity.
 * @returns Props to be used for the cell.
 */
export const buildOrganismAssemblyTaxonomyIds = (
  organism: BRCDataCatalogOrganism
): ComponentProps<typeof C.NTagCell> => {
  return {
    label: "taxonomy IDs",
    values: organism.assemblyTaxonomyIds,
  };
};

/**
 * Build props for the species cell.
 * @param organism - Organism entity.
 * @returns Props to be used for the cell.
 */
export const buildOrganismTaxonomicLevelSpecies = (
  organism: BRCDataCatalogOrganism
): ComponentProps<typeof C.Link> => {
  return {
    label: organism.taxonomicLevelSpecies,
    url: `${ROUTES.ORGANISMS}/${encodeURIComponent(getOrganismId(organism))}`,
  };
};

/**
 * Build props for the strain cell.
 * @param organism - Organism entity.
 * @returns Props to be used for the cell.
 */
export const buildOrganismTaxonomicLevelStrain = (
  organism: BRCDataCatalogOrganism
): ComponentProps<typeof C.NTagCell> => {
  return {
    label: "strains",
    values: organism.taxonomicLevelStrain,
  };
};

/**
 * Build props for the taxonomic group cell.
 * @param entity - Organism or genome entity.
 * @returns Props to be used for the cell.
 */
export const buildTaxonomicGroup = (
  entity: BRCDataCatalogOrganism | BRCDataCatalogGenome
): ComponentProps<typeof C.NTagCell> => {
  return {
    label: "taxonomic groups",
    values: entity.taxonomicGroup,
  };
};

/**
 * Build props for the class cell.
 * @param entity - Organism or genome entity.
 * @returns Props to be used for the cell.
 */
export const buildTaxonomicLevelClass = (
  entity: BRCDataCatalogOrganism | BRCDataCatalogGenome
): ComponentProps<typeof C.BasicCell> => {
  return {
    value: entity.taxonomicLevelClass,
  };
};

/**
 * Build props for the domain cell.
 * @param entity - Organism or genome entity.
 * @returns Props to be used for the cell.
 */
export const buildTaxonomicLevelDomain = (
  entity: BRCDataCatalogOrganism | BRCDataCatalogGenome
): ComponentProps<typeof C.BasicCell> => {
  return {
    value: entity.taxonomicLevelDomain,
  };
};

/**
 * Build props for the family cell.
 * @param entity - Organism or genome entity.
 * @returns Props to be used for the cell.
 */
export const buildTaxonomicLevelFamily = (
  entity: BRCDataCatalogOrganism | BRCDataCatalogGenome
): ComponentProps<typeof C.BasicCell> => {
  return {
    value: entity.taxonomicLevelFamily,
  };
};

/**
 * Build props for the genus cell.
 * @param entity - Organism or genome entity.
 * @returns Props to be used for the cell.
 */
export const buildTaxonomicLevelGenus = (
  entity: BRCDataCatalogOrganism | BRCDataCatalogGenome
): ComponentProps<typeof C.BasicCell> => {
  return {
    value: entity.taxonomicLevelGenus,
  };
};

/**
 * Build props for the kingdom cell.
 * @param entity - Organism or genome entity.
 * @returns Props to be used for the cell.
 */
export const buildTaxonomicLevelKingdom = (
  entity: BRCDataCatalogOrganism | BRCDataCatalogGenome
): ComponentProps<typeof C.BasicCell> => {
  return {
    value: entity.taxonomicLevelKingdom,
  };
};

/**
 * Build props for the order cell.
 * @param entity - Organism or genome entity.
 * @returns Props to be used for the cell.
 */
export const buildTaxonomicLevelOrder = (
  entity: BRCDataCatalogOrganism | BRCDataCatalogGenome
): ComponentProps<typeof C.BasicCell> => {
  return {
    value: entity.taxonomicLevelOrder,
  };
};

/**
 * Build props for the phylum cell.
 * @param entity - Organism or genome entity.
 * @returns Props to be used for the cell.
 */
export const buildTaxonomicLevelPhylum = (
  entity: BRCDataCatalogOrganism | BRCDataCatalogGenome
): ComponentProps<typeof C.BasicCell> => {
  return {
    value: entity.taxonomicLevelPhylum,
  };
};

/**
 * Build props for the realm cell.
 * @param entity - Organism or genome entity.
 * @returns Props to be used for the cell.
 */
export const buildTaxonomicLevelRealm = (
  entity: BRCDataCatalogOrganism | BRCDataCatalogGenome
): ComponentProps<typeof C.BasicCell> => {
  return {
    value: entity.taxonomicLevelRealm,
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
  genome: BRCDataCatalogOrganism | BRCDataCatalogGenome
): ComponentProps<typeof C.BasicCell> => {
  return {
    value: genome.ncbiTaxonomyId,
  };
};

/**
 * Build props for the genome AnalysisMethodsCatalog component.
 * @param genome - Genome entity.
 * @returns Props to be used for the AnalysisMethodsCatalog component.
 */
export const buildGenomeAnalysisMethods = (
  genome: BRCDataCatalogGenome
): ComponentProps<typeof C.AnalysisMethodsCatalog> => {
  return {
    assembly: genome,
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
    portals: [
      ...(genome.ucscBrowserUrl
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
        : []),
      {
        imageProps: {
          alt: NCBI_ASSEMBLY,
          src: "/analysis-portals/ncbi.png",
          width: 20,
        },
        label: NCBI_ASSEMBLY,
        url: `${NCBI_DATASETS_URL}/genome/${genome.accession}`,
      },
      {
        imageProps: {
          alt: NCBI_TAXONOMY,
          src: "/analysis-portals/ncbi.png",
          width: 20,
        },
        label: NCBI_TAXONOMY,
        url: `${NCBI_DATASETS_URL}/taxonomy/${encodeURIComponent(
          genome.ncbiTaxonomyId
        )}`,
      },
    ],
  };
};

/**
 * Build props for the organism BackPageHero component.
 * @param organism - Organism entity.
 * @returns Props to be used for the BackPageHero component.
 */
export const buildOrganismAssembliesHero = (
  organism: BRCDataCatalogOrganism
): ComponentProps<typeof C.BackPageHero> => {
  return {
    breadcrumbs: getOrganismEntityAssembliesBreadcrumbs(organism),
    title: organism.taxonomicLevelSpecies,
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
      "auto minmax(164px, 1fr) minmax(100px, 0.5fr) minmax(100px, 0.5fr) minmax(80px, 0.5fr) repeat(2, minmax(142px, 0.5fr)) minmax(120px, 0.5fr) minmax(80px, 0.5fr) minmax(120px, 0.5fr) repeat(3, minmax(80px, 0.5fr)) minmax(142px, 0.5fr)",
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
      accessorKey: BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_LEVEL_STRAIN,
      cell: ({ row }) =>
        C.BasicCell(buildGenomeTaxonomicLevelStrain(row.original)),
      header: BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMIC_LEVEL_STRAIN,
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
 * Build props for the workflow configuration KeyValuePairs component.
 * @param configuredInput - Configured inputs.
 * @returns Props to be used for the KeyValuePairs component.
 */
export const buildWorkflowConfiguration = (
  configuredInput: ConfiguredInput
): ComponentProps<typeof C.KeyValuePairs> => {
  const keyValuePairs = new Map<Key, Value>();
  for (const stepConfig of WORKFLOW_STEPS) {
    const value = stepConfig.renderValue(configuredInput);
    if (value === undefined) continue;
    keyValuePairs.set(stepConfig.label, value);
  }
  return {
    KeyElType: C.KeyElType,
    KeyValuesElType: (props) => C.Stack({ ...props, gap: 4 }),
    ValueElType: C.TypographyWordBreak,
    keyValuePairs,
  };
};

/**
 * Build props for the workflow details KeyValuePairs component.
 * @param workflow - Workflow.
 * @returns Props to be used for the KeyValuePairs component.
 */
export const buildWorkflowDetails = (
  workflow: Workflow
): ComponentProps<typeof C.KeyValuePairs> => {
  const keyValuePairs = new Map<Key, Value>();
  keyValuePairs.set("Workflow", workflow.workflowName);
  keyValuePairs.set("Description", workflow.workflowDescription);
  return {
    KeyElType: C.KeyElType,
    KeyValuesElType: (props) => C.Stack({ ...props, gap: 4 }),
    ValueElType: C.ValueElType,
    keyValuePairs,
  };
};

/**
 * Get the assembly breadcrumbs.
 * @param assembly - Assembly entity.
 * @returns Breadcrumbs.
 */
function getAssemblyBreadcrumbs(assembly: BRCDataCatalogGenome): Breadcrumb[] {
  return [
    { path: ROUTES.GENOMES, text: "Assemblies" },
    { path: "", text: assembly.accession },
    { path: "", text: "Select a Workflow" },
  ];
}

/**
 * Get text for genome strain, consisting of, from highest to lowest priority, either: strain-only name; strain name including species; or the specified default value.
 * @param genome - Genome entity.
 * @param defaultValue - Default value to use if there's no strain.
 * @returns strain text.
 */
function getGenomeStrainText(
  genome: BRCDataCatalogGenome,
  defaultValue = ""
): string {
  if (genome.strainName) return genome.strainName;
  if (genome.taxonomicLevelStrain !== "None")
    return genome.taxonomicLevelStrain;
  return defaultValue;
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
    { path: "", text: `${organism.taxonomicLevelSpecies}` },
    { path: "", text: "Assemblies" },
  ];
}
