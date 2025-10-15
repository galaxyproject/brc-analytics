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
  Outbreak,
  Workflow,
} from "../../../../apis/catalog/brc-analytics-catalog/common/entities";
import * as C from "../../../../components";
import {
  GENOME_BROWSER,
  NCBI_ASSEMBLY,
  NCBI_DATASETS_URL,
  NCBI_TAXONOMY,
} from "./constants";
import { ColumnDef, getSortedRowModel } from "@tanstack/react-table";
import {
  BRC_DATA_CATALOG_CATEGORY_KEY,
  BRC_DATA_CATALOG_CATEGORY_LABEL,
} from "site-config/brc-analytics/category";
import {
  getGenomeOrganismId,
  getOrganismId,
} from "../../../../apis/catalog/brc-analytics-catalog/common/utils";
import { COLUMN_IDENTIFIER } from "@databiosphere/findable-ui/lib/components/Table/common/columnIdentifier";
import { ConfiguredInput } from "../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import { CHIP_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/chip";
import {
  getPriorityColor,
  getPriorityLabel,
} from "../../../../views/PriorityPathogensView/components/PriorityPathogens/utils";
import { KeyValueSection } from "../../../../components/Entity/components/Section/KeyValueSection/keyValueSection";
import { ResourcesSection } from "../../../../views/PriorityPathogenView/components/ResourcesSection/resourcesSection";
import Router from "next/router";
import slugify from "slugify";
import { SLUGIFY_OPTIONS } from "../../../../common/constants";
import { LinkProps } from "next/link";
import { FluidPaper } from "@databiosphere/findable-ui/lib/components/common/Paper/paper.styles";
import {
  GA2AssemblyEntity,
  GA2OrganismEntity,
} from "../../../../apis/catalog/ga2/entities";
import { sanitizeEntityId } from "../../../../apis/catalog/common/utils";
import { StepConfig } from "../../../../components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/types";

/**
 * Build props for the accession cell.
 * @param entity - Entity with an accession.
 * @returns Props to be used for the cell.
 */
export const buildAccession = (
  entity: BRCDataCatalogGenome | GA2AssemblyEntity
): ComponentProps<typeof C.BasicCell> => {
  return {
    value: entity.accession,
  };
};

/**
 * Build props for the genome analysis cell.
 * @param entity - Entity with an accession, ncbiTaxonomyId, and ucscBrowserUrl.
 * @returns Props to be used for the AnalyzeGenome component.
 */
export const buildAnalyzeGenome = (
  entity: BRCDataCatalogGenome | GA2AssemblyEntity
): ComponentProps<typeof C.AnalyzeGenome> => {
  const { accession, ncbiTaxonomyId, ucscBrowserUrl } = entity;
  return {
    analyze: {
      label: "Analyze",
      url: `${ROUTES.GENOMES}/${encodeURIComponent(sanitizeEntityId(accession))}`,
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
 * @param entity - Entity with an annotationStatus property.
 * @returns Props for the BasicCell component.
 */
export const buildAnnotationStatus = (
  entity: BRCDataCatalogGenome | GA2AssemblyEntity
): ComponentProps<typeof C.BasicCell> => {
  return {
    value: entity.annotationStatus,
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
  assembly: BRCDataCatalogGenome | GA2AssemblyEntity
): ComponentProps<typeof C.KeyValuePairs> => {
  const keyValuePairs = new Map<Key, Value>();
  keyValuePairs.set(
    BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMIC_LEVEL_SPECIES,
    C.Link({
      label: assembly.taxonomicLevelSpecies,
      url: `${ROUTES.ORGANISMS}/${encodeURIComponent(sanitizeEntityId(assembly.speciesTaxonomyId))}`,
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
  if ("priorityPathogenName" in assembly) {
    keyValuePairs.set(
      BRC_DATA_CATALOG_CATEGORY_LABEL.PRIORITY_PATHOGEN_NAME,
      C.Chip(buildPriorityPathogen(assembly))
    );
  }
  return {
    KeyElType: C.KeyElType,
    KeyValuesElType: (props) => C.Stack({ ...props, gap: 4 }),
    ValueElType: C.ValueElType,
    keyValuePairs,
  };
};

/**
 * Build props for the assemblies cell.
 * @param entity - Entity with an assemblyCount property.
 * @returns Props for the BasicCell component.
 */
export const buildAssemblyCount = (
  entity: BRCDataCatalogOrganism | GA2OrganismEntity
): ComponentProps<typeof C.BasicCell> => {
  return {
    value: formatNumber(entity.assemblyCount),
  };
};

/**
 * Build props for the chromosomes cell.
 * @param entity - Entity with a chromosomes property.
 * @returns Props for the BasicCell component.
 */
export const buildChromosomes = (
  entity: BRCDataCatalogGenome | GA2AssemblyEntity
): ComponentProps<typeof C.BasicCell> => {
  return {
    value: formatNumber(entity.chromosomes),
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
 * @param entity - Entity with a coverage property.
 * @returns Props for the BasicCell component.
 */
export const buildCoverage = (
  entity: BRCDataCatalogGenome | GA2AssemblyEntity
): ComponentProps<typeof C.BasicCell> => {
  return {
    value: entity.coverage,
  };
};

/**
 * Build props for the GC% cell.
 * @param entity - Entity with a gcPercent property.
 * @returns Props for the BasicCell component.
 */
export const buildGcPercent = (
  entity: BRCDataCatalogGenome | GA2AssemblyEntity
): ComponentProps<typeof C.BasicCell> => {
  return {
    value: entity.gcPercent,
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
 * @param entity - Entity with a strainName and taxonomicLevelStrain property.
 * @returns Props to be used for the BasicCell component.
 */
export const buildGenomeTaxonomicLevelStrain = (
  entity: BRCDataCatalogGenome | GA2AssemblyEntity
): ComponentProps<typeof C.BasicCell> => {
  return {
    value: getGenomeStrainText(entity),
  };
};

/**
 * Build props for the serotype cell.
 * @param genome - Genome entity.
 * @returns Props to be used for the cell.
 */
export const buildGenomeTaxonomicLevelSerotype = (
  genome: BRCDataCatalogGenome
): ComponentProps<typeof C.BasicCell> => {
  return {
    value: getGenomeSerotypeText(genome),
  };
};

/**
 * Build props for the isolate cell.
 * @param genome - Genome entity.
 * @returns Props to be used for the cell.
 */
export const buildGenomeTaxonomicLevelIsolate = (
  genome: BRCDataCatalogGenome
): ComponentProps<typeof C.BasicCell> => {
  return {
    value: getGenomeIsolateText(genome),
  };
};

/**
 * Build props for the "is ref" cell.
 * @param entity - Entity with an isRef property.
 * @returns Props for the ChipCell component.
 */
export const buildIsRef = (
  entity: BRCDataCatalogGenome | GA2AssemblyEntity
): ComponentProps<typeof C.ChipCell> => {
  return {
    getValue: () => ({
      color:
        entity.isRef.toLowerCase() === "yes"
          ? CHIP_PROPS.COLOR.SUCCESS
          : CHIP_PROPS.COLOR.DEFAULT,
      label: entity.isRef,
      variant: CHIP_PROPS.VARIANT.STATUS,
    }),
  } as ComponentProps<typeof C.ChipCell>;
};

/**
 * Build props for the length cell.
 * @param entity - Entity with a length property.
 * @returns Props for the BasicCell component.
 */
export const buildLength = (
  entity: BRCDataCatalogGenome | GA2AssemblyEntity
): ComponentProps<typeof C.BasicCell> => {
  return {
    value: formatNumber(entity.length),
  };
};

/**
 * Build props for the level cell.
 * @param entity - Entity with a level property.
 * @returns Props for the BasicCell component.
 */
export const buildLevel = (
  entity: BRCDataCatalogGenome | GA2AssemblyEntity
): ComponentProps<typeof C.BasicCell> => {
  return {
    value: entity.level,
  };
};

/**
 * Build props for the assembly taxonomy IDs cell.
 * @param entity - Entity with a assemblyTaxonomyIds property.
 * @returns Props for the NTagCell component.
 */
export const buildOrganismAssemblyTaxonomyIds = (
  entity: BRCDataCatalogOrganism | GA2OrganismEntity
): ComponentProps<typeof C.NTagCell> => {
  return {
    label: "taxonomy IDs",
    values: entity.assemblyTaxonomyIds,
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
 * Build props for the serotype cell.
 * @param organism - Organism entity.
 * @returns Props to be used for the cell.
 */
export const buildOrganismTaxonomicLevelSerotype = (
  organism: BRCDataCatalogOrganism
): ComponentProps<typeof C.NTagCell> => {
  return {
    label: "serotypes",
    values: organism.taxonomicLevelSerotype,
  };
};

/**
 * Build props for the isolate cell.
 * @param organism - Organism entity.
 * @returns Props to be used for the cell.
 */
export const buildOrganismTaxonomicLevelIsolate = (
  organism: BRCDataCatalogOrganism
): ComponentProps<typeof C.NTagCell> => {
  return {
    label: "isolates",
    values: organism.taxonomicLevelIsolate,
  };
};

/**
 * Build props for the priority cell.
 * @param entity - Genome or organism entity.
 * @returns Props to be used for the BasicCell component.
 */
export const buildPriority = (
  entity: BRCDataCatalogGenome | BRCDataCatalogOrganism
): ComponentProps<typeof C.BasicCell> => {
  return {
    value: entity.priority ?? "Unprioritized",
  };
};

/**
 * Build props for the priority pathogen cell.
 * @param entity - Genome or organism entity.
 * @returns Props to be used for the Chip component.
 */
export const buildPriorityPathogen = (
  entity: BRCDataCatalogGenome | BRCDataCatalogOrganism
): ComponentProps<typeof C.Chip> => {
  const { priority, priorityPathogenName } = entity;
  return {
    color: getPriorityColor(priority),
    label: priorityPathogenName || "-",
    onClick: priorityPathogenName
      ? (): void => {
          Router.push({
            pathname: ROUTES.PRIORITY_PATHOGEN,
            query: {
              entityId: slugify(priorityPathogenName, SLUGIFY_OPTIONS),
              entityListType: "priority-pathogens",
            },
          });
        }
      : undefined,
    variant: CHIP_PROPS.VARIANT.STATUS,
  };
};

/**
 * Build props for the priority pathogen tooltip.
 * @param entity - Genome or organism entity.
 * @returns Props to be used for the Tooltip component.
 */
export const buildPriorityPathogenTooltip = (
  entity: BRCDataCatalogGenome | BRCDataCatalogOrganism
): Omit<ComponentProps<typeof C.Tooltip>, "children"> => {
  return {
    arrow: true,
    title: entity.priorityPathogenName
      ? `${entity.priorityPathogenName} - ${getPriorityLabel(entity.priority)}`
      : undefined,
  };
};

/**
 * Build props for the priority pathogen BackPageHero component.
 * @param priorityPathogen - Priority pathogen entity.
 * @returns Props to be used for the BackPageHero component.
 */
export const buildPriorityPathogenHero = (
  priorityPathogen: Outbreak
): ComponentProps<typeof C.BackPageHero> => {
  return {
    breadcrumbs: getPriorityPathogenEntityBreadcrumbs(priorityPathogen),
    title: priorityPathogen.name,
  };
};

/**
 * Build props for the priority pathogen description section.
 * @param priorityPathogen - Priority pathogen entity.
 * @returns Props to be used for the MDXSection component.
 */
export const buildPriorityPathogenDescription = (
  priorityPathogen: Outbreak
): ComponentProps<typeof C.MDXSection> => {
  return {
    mdxRemoteSerializeResult: priorityPathogen.description,
    title: "Description",
  };
};

/**
 * Build props for the priority pathogen details section.
 * @param priorityPathogen - Priority pathogen entity.
 * @returns Props to be used for the KeyValuePairs component.
 */
export const buildPriorityPathogenDetails = (
  priorityPathogen: Outbreak
): ComponentProps<typeof KeyValueSection> => {
  const keyValuePairs = new Map<Key, Value>();
  keyValuePairs.set(
    BRC_DATA_CATALOG_CATEGORY_LABEL.PRIORITY,
    C.Chip({
      color: getPriorityColor(priorityPathogen.priority),
      label: getPriorityLabel(priorityPathogen.priority),
      onClick: (): void => {
        Router.push({
          pathname: ROUTES.ORGANISMS,
          query: {
            filter: JSON.stringify([
              {
                categoryKey: BRC_DATA_CATALOG_CATEGORY_KEY.PRIORITY,
                value: [priorityPathogen.priority],
              },
            ]),
          },
        });
      },
      variant: CHIP_PROPS.VARIANT.STATUS,
    })
  );
  [
    ["Organisms", ROUTES.ORGANISMS],
    ["Assemblies", ROUTES.GENOMES],
  ].forEach(([key, pathname]) => {
    keyValuePairs.set(
      key,
      C.AppLink({
        children: priorityPathogen.taxonName,
        href: getEntityLinkWithPriorityPathogenFilter(
          priorityPathogen,
          pathname
        ),
      })
    );
  });
  return {
    keyValuePairs,
    title: "Priority Pathogen details",
  };
};

/**
 * Build props for the priority pathogen resources section.
 * @param priorityPathogen - Priority pathogen entity.
 * @returns Props to be used for the ResourcesSection component.
 */
export const buildPriorityPathogenResources = (
  priorityPathogen: Outbreak
): ComponentProps<typeof ResourcesSection> => {
  return {
    resources: priorityPathogen.resources,
    title: "Resources",
  };
};

/**
 * Build props for the taxonomic group cell.
 * @param entity - Entity with a taxonomicGroup property.
 * @returns Props for the NTagCell component.
 */
type TaxonomicGroupEntity =
  | BRCDataCatalogOrganism
  | BRCDataCatalogGenome
  | GA2AssemblyEntity
  | GA2OrganismEntity;

export const buildTaxonomicGroup = (
  entity: TaxonomicGroupEntity
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
  entity: TaxonomicGroupEntity
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
  entity: TaxonomicGroupEntity
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
  entity: TaxonomicGroupEntity
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
  entity: TaxonomicGroupEntity
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
  entity: TaxonomicGroupEntity
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
  entity: TaxonomicGroupEntity
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
  entity: TaxonomicGroupEntity
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
 * @param entity - Entity with a scaffoldCount property.
 * @returns Props for the BasicCell component.
 */
export const buildScaffoldCount = (
  entity: BRCDataCatalogGenome | GA2AssemblyEntity
): ComponentProps<typeof C.BasicCell> => {
  return {
    value: formatNumber(entity.scaffoldCount),
  };
};

/**
 * Build props for the scaffold L50 cell.
 * @param entity - Entity with a scaffoldL50 property.
 * @returns Props for the BasicCell component.
 */
export const buildScaffoldL50 = (
  entity: BRCDataCatalogGenome | GA2AssemblyEntity
): ComponentProps<typeof C.BasicCell> => {
  return {
    value: formatNumber(entity.scaffoldL50),
  };
};

/**
 * Build props for the scaffold N50 cell.
 * @param entity - Entity with a scaffoldN50 property.
 * @returns Props for the BasicCell component.
 */
export const buildScaffoldN50 = (
  entity: BRCDataCatalogGenome | GA2AssemblyEntity
): ComponentProps<typeof C.BasicCell> => {
  return {
    value: formatNumber(entity.scaffoldN50),
  };
};

/**
 * Build props for the taxonomy ID cell.
 * @param entity - Entity with a ncbiTaxonomyId property.
 * @returns Props for the BasicCell component.
 */
export const buildTaxonomyId = (
  entity: BRCDataCatalogOrganism | BRCDataCatalogGenome | GA2AssemblyEntity
): ComponentProps<typeof C.BasicCell> => {
  return {
    value: entity.ncbiTaxonomyId,
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
 * @param entity - Entity with an accession, ucscBrowserUrl and ncbiTaxonomyId property.
 * @returns Props to be used for the AnalysisPortals component.
 */
export const buildGenomeAnalysisPortals = (
  entity: BRCDataCatalogGenome | GA2AssemblyEntity
): ComponentProps<typeof C.AnalysisPortals> => {
  return {
    portals: [
      ...(entity.ucscBrowserUrl
        ? [
            {
              imageProps: {
                alt: GENOME_BROWSER,
                src: "/analysis-portals/ucsc-genome.png",
                width: 20,
              },
              label: GENOME_BROWSER,
              url: entity.ucscBrowserUrl,
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
        url: `${NCBI_DATASETS_URL}/genome/${entity.accession}`,
      },
      {
        imageProps: {
          alt: NCBI_TAXONOMY,
          src: "/analysis-portals/ncbi.png",
          width: 20,
        },
        label: NCBI_TAXONOMY,
        url: `${NCBI_DATASETS_URL}/taxonomy/${encodeURIComponent(
          entity.ncbiTaxonomyId
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
    Paper: FluidPaper,
    columns: buildOrganismGenomesTableColumns(),
    gridTemplateColumns:
      "auto minmax(164px, 1fr) minmax(180px, 0.5fr) minmax(180px, 0.5fr) minmax(180px, 0.5fr) minmax(144px, 0.5fr) minmax(100px, 0.5fr) repeat(2, minmax(142px, 0.5fr)) minmax(132px, 0.5fr) minmax(120px, 0.5fr) minmax(120px, 0.5fr) repeat(3, minmax(120px, 0.5fr)) minmax(180px, 0.5fr)",
    items: organism.genomes,
    noResultsTitle: "No Assemblies",
    tableOptions: {
      enableRowPosition: false,
      enableSorting: true,
      getSortedRowModel: getSortedRowModel(),
      initialState: {
        columnVisibility: { [COLUMN_IDENTIFIER.ROW_POSITION]: false },
        sorting: [
          { desc: true, id: BRC_DATA_CATALOG_CATEGORY_KEY.IS_REF },
          { desc: false, id: BRC_DATA_CATALOG_CATEGORY_KEY.ACCESSION },
        ],
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
      meta: { columnPinned: true },
    },
    {
      accessorKey: BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_LEVEL_STRAIN,
      cell: ({ row }) =>
        C.BasicCell(buildGenomeTaxonomicLevelStrain(row.original)),
      header: BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMIC_LEVEL_STRAIN,
    },
    {
      accessorKey: BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_LEVEL_SEROTYPE,
      cell: ({ row }) =>
        C.BasicCell(buildGenomeTaxonomicLevelSerotype(row.original)),
      header: BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMIC_LEVEL_SEROTYPE,
    },
    {
      accessorKey: BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_LEVEL_ISOLATE,
      cell: ({ row }) =>
        C.BasicCell(buildGenomeTaxonomicLevelIsolate(row.original)),
      header: BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMIC_LEVEL_ISOLATE,
    },
    {
      accessorKey: BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMY_ID,
      cell: ({ row }) => C.BasicCell(buildTaxonomyId(row.original)),
      header: BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMY_ID,
    },
    {
      accessorKey: BRC_DATA_CATALOG_CATEGORY_KEY.IS_REF,
      cell: ({ row }) => C.ChipCell(buildIsRef(row.original)),
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
 * @param configuredSteps - Configured steps.
 * @returns Props to be used for the KeyValuePairs component.
 */
export const buildWorkflowConfiguration = (
  configuredInput: ConfiguredInput,
  configuredSteps: StepConfig[]
): ComponentProps<typeof C.KeyValuePairs> => {
  const keyValuePairs = new Map<Key, Value>();
  for (const stepConfig of configuredSteps) {
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
 * Returns an entity list link with a priority pathogen filter.
 * @param priorityPathogen - Priority pathogen entity.
 * @param pathname - Pathname to use for the link.
 * @returns Props to be used for the AppLink component.
 */
function getEntityLinkWithPriorityPathogenFilter(
  priorityPathogen: Outbreak,
  pathname: string
): LinkProps["href"] {
  return {
    pathname,
    query: {
      filter: JSON.stringify([
        {
          categoryKey: BRC_DATA_CATALOG_CATEGORY_KEY.PRIORITY_PATHOGEN_NAME,
          value: [priorityPathogen.name],
        },
      ]),
    },
  };
}

/**
 * Get text for genome strain, consisting of, from highest to lowest priority, either: strain-only name; strain name including species; or the specified default value.
 * @param entity - Entity with a strainName and taxonomicLevelStrain property.
 * @param defaultValue - Default value to use if there's no strain.
 * @returns strain text.
 */
function getGenomeStrainText(
  entity: BRCDataCatalogGenome | GA2AssemblyEntity,
  defaultValue = ""
): string {
  if (entity.strainName) return entity.strainName;
  if (entity.taxonomicLevelStrain !== "None")
    return entity.taxonomicLevelStrain;
  return defaultValue;
}

/**
 * Get the genome serotype text.
 * @param genome - Genome entity.
 * @param defaultValue - Default value if no serotype is found.
 * @returns serotype text.
 */
function getGenomeSerotypeText(
  genome: BRCDataCatalogGenome,
  defaultValue = ""
): string {
  if (genome.taxonomicLevelSerotype !== "None")
    return genome.taxonomicLevelSerotype;
  return defaultValue;
}

/**
 * Get the genome isolate text.
 * @param genome - Genome entity.
 * @param defaultValue - Default value if no isolate is found.
 * @returns isolate text.
 */
function getGenomeIsolateText(
  genome: BRCDataCatalogGenome,
  defaultValue = ""
): string {
  if (genome.taxonomicLevelIsolate !== "None")
    return genome.taxonomicLevelIsolate;
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
    { path: "", text: organism.taxonomicLevelSpecies },
    { path: "", text: "Assemblies" },
  ];
}

/**
 * Get the priority pathogen entity breadcrumbs.
 * @param priorityPathogen - Priority pathogen entity.
 * @returns Breadcrumbs.
 */
function getPriorityPathogenEntityBreadcrumbs(
  priorityPathogen: Outbreak
): Breadcrumb[] {
  return [
    { path: ROUTES.PRIORITY_PATHOGENS, text: "Priority Pathogens" },
    { path: "", text: priorityPathogen.name },
  ];
}

/**
 * Format a number to a string.
 * @param value - Number to format.
 * @returns Formatted number or empty string if invalid.
 */
export function formatNumber(value: unknown): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "";
  return value.toLocaleString();
}
