import { Breadcrumb } from "@databiosphere/findable-ui/lib/components/common/Breadcrumbs/breadcrumbs";
import {
  Key,
  Value,
} from "@databiosphere/findable-ui/lib/components/common/KeyValuePairs/keyValuePairs";
import { COLUMN_IDENTIFIER } from "@databiosphere/findable-ui/lib/components/Table/common/columnIdentifier";
import { CHIP_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/chip";
import { replaceParameters } from "@databiosphere/findable-ui/lib/utils/replaceParameters";
import { ColumnDef, RowData } from "@tanstack/react-table";
import type { SpeciesTag } from "app/components/Table/components/TableCell/components/SpeciesCell/types";
import type { Organism } from "app/views/OrganismView/types";
import { parseISO } from "date-fns";
import { LinkProps } from "next/link";
import Router from "next/router";
import { ComponentProps } from "react";
import {
  BRC_DATA_CATALOG_CATEGORY_KEY,
  BRC_DATA_CATALOG_CATEGORY_LABEL,
} from "site-config/brc-analytics/category";
import slugify from "slugify";
import { ROUTES } from "../../../../../routes/constants";
import {
  BRCDataCatalogGenome,
  BRCDataCatalogOrganism,
  Outbreak,
  Workflow,
} from "../../../../apis/catalog/brc-analytics-catalog/common/entities";
import type { OUTBREAK_PRIORITY } from "../../../../apis/catalog/brc-analytics-catalog/common/schema-entities";
import {
  getGenomeOrganismId,
  getOrganismId,
} from "../../../../apis/catalog/brc-analytics-catalog/common/utils";
import { sanitizeEntityId } from "../../../../apis/catalog/common/utils";
import {
  GA2AssemblyEntity,
  GA2OrganismEntity,
} from "../../../../apis/catalog/ga2/entities";
import { SLUGIFY_OPTIONS } from "../../../../common/constants";
import * as C from "../../../../components";
import { StepConfig } from "../../../../components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/types";
import { KeyValueSection } from "../../../../components/Entity/components/Section/KeyValueSection/keyValueSection";
import { formatDate } from "../../../../utils/date-fns";
import {
  getPriorityColor,
  getPriorityLabel,
} from "../../../../views/PriorityPathogensView/components/PriorityPathogens/utils";
import { ResourcesSection } from "../../../../views/PriorityPathogenView/components/ResourcesSection/resourcesSection";
import { ConfiguredInput } from "../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import {
  GALAXY_DATACACHE,
  GENOME_BROWSER,
  NCBI_ASSEMBLY,
  NCBI_DATASETS_URL,
  NCBI_TAXONOMY,
} from "./constants";

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
      url: replaceParameters(ROUTES.GENOME, {
        entityId: sanitizeEntityId(accession),
      }),
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
 * Build props for the assembly details KeyValuePairs component.
 * @param assembly - Assembly entity.
 * @returns Props to be used for the KeyValuePairs component.
 */
export const buildAssemblyDetails = (
  assembly: BRCDataCatalogGenome | GA2AssemblyEntity
): ComponentProps<typeof C.KeyValuePairs> => {
  const keyValuePairs = new Map<Key, Value>();
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
 * Build props for the consolidated species cell on the assembly list page.
 * Combines the species name and taxonomy id with the populated minor taxonomy
 * fields (strain, serotype, isolate, taxonomic group) and priority pathogen,
 * each surfaced as a chip only when present.
 * @param genome - Genome entity.
 * @returns Props to be used for the SpeciesCell component.
 */
export const buildGenomeSpecies = (
  genome: BRCDataCatalogGenome
): ComponentProps<typeof C.SpeciesCell> => {
  const tags: SpeciesTag[] = [];
  const strain = getGenomeStrainText(genome);
  if (strain) tags.push({ label: "strain", value: strain });
  const serotype = getGenomeSerotypeText(genome);
  if (serotype) tags.push({ label: "serotype", value: serotype });
  const isolate = getGenomeIsolateText(genome);
  if (isolate) tags.push({ label: "isolate", value: isolate });
  if (genome.taxonomicGroup.length > 0)
    tags.push({
      label: "group",
      value: genome.taxonomicGroup.join(", "),
    });
  if (genome.priority)
    tags.push({
      color: getPriorityColor(genome.priority),
      label: "priority",
      tooltip: genome.priorityPathogenName ?? undefined,
      value: genome.priority.toLowerCase().replace(/_/g, " "),
    });
  return {
    ncbiTaxonomyId: genome.ncbiTaxonomyId,
    species: {
      label: genome.taxonomicLevelSpecies,
      url: `${ROUTES.ORGANISMS}/${encodeURIComponent(getGenomeOrganismId(genome))}`,
    },
    tags,
  };
};

/**
 * Build props for the species cell on the organism detail page assembly table.
 * Same as buildGenomeSpecies but with an empty species url — the species is the
 * page's own organism, so Link renders the name as plain text (no self-link).
 * @param genome - Genome entity.
 * @returns Props to be used for the SpeciesCell component.
 */
export const buildOrganismGenomeSpecies = (
  genome: BRCDataCatalogGenome
): ComponentProps<typeof C.SpeciesCell> => {
  const props = buildGenomeSpecies(genome);
  return { ...props, species: { ...props.species, url: "" } };
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
 * Maps each NCBI assembly level to its filled-bar count (most → least complete).
 */
const LEVEL_FILLED_COUNT: Record<string, number> = {
  Chromosome: 3,
  "Complete Genome": 4,
  Contig: 1,
  Scaffold: 2,
};

/**
 * Build props for the level cell — a tiered bar indicator plus the level label.
 * @param entity - Entity with a level property.
 * @returns Props for the LevelCell component.
 */
export const buildLevel = (
  entity: BRCDataCatalogGenome | GA2AssemblyEntity
): ComponentProps<typeof C.LevelCell> => {
  return {
    filledCount: LEVEL_FILLED_COUNT[entity.level] ?? 0,
    label: entity.level,
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
 * Build props for the organism details KeyValuePairs component.
 * @param organism - Organism details (mapped from an assembly or organism source).
 * @returns Props to be used for the KeyValuePairs component.
 */
export const buildOrganismDetails = (
  organism: Organism
): ComponentProps<typeof C.KeyValuePairs> => {
  const {
    ncbiTaxonomyId,
    priorityPathogenName,
    taxonomicLevelIsolate,
    taxonomicLevelSerotype,
    taxonomicLevelSpecies,
    taxonomicLevelStrain,
  } = organism;

  const keyValuePairs = new Map<Key, Value>();

  keyValuePairs.set(
    BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMIC_LEVEL_SPECIES,
    C.Link({
      label: taxonomicLevelSpecies,
      url: `${ROUTES.ORGANISMS}/${encodeURIComponent(sanitizeEntityId(ncbiTaxonomyId))}`,
    })
  );
  const taxonomicLevels: [Key, string[] | undefined][] = [
    [
      BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMIC_LEVEL_STRAIN,
      taxonomicLevelStrain,
    ],
    [
      BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMIC_LEVEL_SEROTYPE,
      taxonomicLevelSerotype,
    ],
    [
      BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMIC_LEVEL_ISOLATE,
      taxonomicLevelIsolate,
    ],
  ];
  for (const [label, values] of taxonomicLevels) {
    if (values?.length) keyValuePairs.set(label, values.join(", "));
  }
  if (priorityPathogenName) {
    keyValuePairs.set(
      BRC_DATA_CATALOG_CATEGORY_LABEL.PRIORITY_PATHOGEN_NAME,
      C.Chip(buildPriorityPathogen(organism))
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
 * @param entity - Source carrying priority pathogen fields.
 * @param entity.priority - Priority.
 * @param entity.priorityPathogenName - Priority pathogen name.
 * @returns Props to be used for the Chip component.
 */
export const buildPriorityPathogen = (entity: {
  priority?: OUTBREAK_PRIORITY | null;
  priorityPathogenName?: string | null;
}): ComponentProps<typeof C.Chip> => {
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
 * Build props for the release date cell, displaying the release year.
 * @param entity - Entity with a releaseDate property.
 * @returns Props for the BasicCell component.
 */
export const buildReleaseDate = (
  entity: BRCDataCatalogGenome | GA2AssemblyEntity
): ComponentProps<typeof C.BasicCell> => {
  return {
    value: entity.releaseDate
      ? formatDate(parseISO(entity.releaseDate), "yyyy")
      : "",
  };
};

/**
 * Build props for the release date tooltip, showing the full release date.
 * @param entity - Entity with a releaseDate property.
 * @returns Props for the Tooltip component.
 */
export const buildReleaseDateTooltip = (
  entity: BRCDataCatalogGenome | GA2AssemblyEntity
): Omit<ComponentProps<typeof C.Tooltip>, "children"> => {
  return {
    arrow: true,
    title: entity.releaseDate
      ? formatDate(parseISO(entity.releaseDate))
      : undefined,
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
 * Build props for the assembly AnalysisPortals component.
 * @param entity - Entity with an accession, ucscBrowserUrl and ncbiTaxonomyId property.
 * @returns Props to be used for the AnalysisPortals component.
 */
export const buildAssemblyResources = (
  entity: BRCDataCatalogGenome | GA2AssemblyEntity
): Pick<ComponentProps<typeof C.AnalysisPortals>, "portals"> => {
  return {
    portals: [
      ...(entity.galaxyDatacacheUrl
        ? [
            {
              imageProps: {
                alt: GALAXY_DATACACHE,
                src: "/analysis-portals/galaxy.svg",
                width: 20,
              },
              label: GALAXY_DATACACHE,
              url: entity.galaxyDatacacheUrl,
            },
          ]
        : []),
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
export const buildOrganismHero = (
  organism: BRCDataCatalogOrganism
): ComponentProps<typeof C.BackPageHero> => {
  return {
    breadcrumbs: getOrganismEntityBreadcrumbs(organism),
    title: organism.taxonomicLevelSpecies,
  };
};

/**
 * Build props for the organism detail main content.
 * @param organism - Organism entity.
 * @returns Props for the OrganismViewMain component.
 */
export const buildOrganismViewMain = (
  organism: BRCDataCatalogOrganism
): ComponentProps<typeof C.OrganismViewMain> => {
  return {
    entityId: getOrganismId(organism),
    organism,
    tableOptions: buildOrganismGenomesTable(organism),
  };
};

/**
 * Build table options (columns, data, initial state) for the genomes table for the given organism.
 * @param organism - Organism entity with genomes to be displayed in the table.
 * @returns table options.
 */
export function buildOrganismGenomesTable(
  organism: BRCDataCatalogOrganism
): ComponentProps<typeof C.OrganismViewMain>["tableOptions"] {
  return {
    // Cast: ColumnDef<T> is invariant in T, so the catalog-specific row type
    // cannot widen to RowData even though BRCDataCatalogGenome extends it.
    columns: buildOrganismGenomesTableColumns() as ColumnDef<RowData>[],
    data: organism.genomes,
    initialState: {
      columnVisibility: { [COLUMN_IDENTIFIER.ROW_POSITION]: false },
      sorting: [
        { desc: true, id: BRC_DATA_CATALOG_CATEGORY_KEY.IS_REF },
        { desc: false, id: BRC_DATA_CATALOG_CATEGORY_KEY.ACCESSION },
      ],
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
      enableSorting: false,
      header: BRC_DATA_CATALOG_CATEGORY_LABEL.ANALYZE_GENOME,
      meta: { width: "auto" },
    },
    {
      accessorKey: BRC_DATA_CATALOG_CATEGORY_KEY.TAXONOMIC_LEVEL_SPECIES,
      cell: ({ row }) =>
        C.SpeciesCell(buildOrganismGenomeSpecies(row.original)),
      header: BRC_DATA_CATALOG_CATEGORY_LABEL.TAXONOMIC_LEVEL_SPECIES,
      meta: { columnPinned: true, width: { max: "1.5fr", min: "340px" } },
    },
    {
      accessorKey: BRC_DATA_CATALOG_CATEGORY_KEY.ACCESSION,
      cell: ({ row }) => C.BasicCell(buildAccession(row.original)),
      header: BRC_DATA_CATALOG_CATEGORY_LABEL.ACCESSION,
      meta: { width: { max: "1fr", min: "164px" } },
    },
    {
      accessorKey: BRC_DATA_CATALOG_CATEGORY_KEY.IS_REF,
      cell: ({ row }) => C.ChipCell(buildIsRef(row.original)),
      header: BRC_DATA_CATALOG_CATEGORY_LABEL.IS_REF,
      meta: { width: { max: "0.5fr", min: "100px" } },
    },
    {
      accessorKey: BRC_DATA_CATALOG_CATEGORY_KEY.LEVEL,
      cell: ({ row }) => C.LevelCell(buildLevel(row.original)),
      header: BRC_DATA_CATALOG_CATEGORY_LABEL.LEVEL,
      meta: { width: { max: "0.5fr", min: "142px" } },
    },
    {
      accessorKey: BRC_DATA_CATALOG_CATEGORY_KEY.CHROMOSOMES,
      cell: ({ row }) => C.BasicCell(buildChromosomes(row.original)),
      header: BRC_DATA_CATALOG_CATEGORY_LABEL.CHROMOSOMES,
      meta: { width: { max: "0.5fr", min: "142px" } },
    },
    {
      accessorKey: BRC_DATA_CATALOG_CATEGORY_KEY.LENGTH,
      cell: ({ row }) => C.BasicCell(buildLength(row.original)),
      header: BRC_DATA_CATALOG_CATEGORY_LABEL.LENGTH,
      meta: { width: { max: "0.5fr", min: "132px" } },
    },
    {
      accessorKey: BRC_DATA_CATALOG_CATEGORY_KEY.SCAFFOLD_COUNT,
      cell: ({ row }) => C.BasicCell(buildScaffoldCount(row.original)),
      header: BRC_DATA_CATALOG_CATEGORY_LABEL.SCAFFOLD_COUNT,
      meta: { width: { max: "0.5fr", min: "120px" } },
    },
    {
      accessorKey: BRC_DATA_CATALOG_CATEGORY_KEY.SCAFFOLD_N50,
      cell: ({ row }) => C.BasicCell(buildScaffoldN50(row.original)),
      header: BRC_DATA_CATALOG_CATEGORY_LABEL.SCAFFOLD_N50,
      meta: { width: { max: "0.5fr", min: "120px" } },
    },
    {
      accessorKey: BRC_DATA_CATALOG_CATEGORY_KEY.SCAFFOLD_L50,
      cell: ({ row }) => C.BasicCell(buildScaffoldL50(row.original)),
      header: BRC_DATA_CATALOG_CATEGORY_LABEL.SCAFFOLD_L50,
      meta: { width: { max: "0.5fr", min: "120px" } },
    },
    {
      accessorKey: BRC_DATA_CATALOG_CATEGORY_KEY.COVERAGE,
      cell: ({ row }) => C.BasicCell(buildCoverage(row.original)),
      header: BRC_DATA_CATALOG_CATEGORY_LABEL.COVERAGE,
      meta: { width: { max: "0.5fr", min: "120px" } },
    },
    {
      accessorKey: BRC_DATA_CATALOG_CATEGORY_KEY.GC_PERCENT,
      cell: ({ row }) => C.BasicCell(buildGcPercent(row.original)),
      header: BRC_DATA_CATALOG_CATEGORY_LABEL.GC_PERCENT,
      meta: { width: { max: "0.5fr", min: "120px" } },
    },
    {
      accessorKey: BRC_DATA_CATALOG_CATEGORY_KEY.ANNOTATION_STATUS,
      cell: ({ row }) => C.BasicCell(buildAnnotationStatus(row.original)),
      header: BRC_DATA_CATALOG_CATEGORY_LABEL.ANNOTATION_STATUS,
      meta: { width: { max: "0.5fr", min: "180px" } },
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
  for (const key of Object.keys(configuredInput)) {
    // Find the step config, for the configured input.
    const stepConfig = configuredSteps.find((step) => step.key === key);
    if (!stepConfig) continue;
    // Get the value for the configured input.
    const value = stepConfig.renderValue?.(configuredInput);
    if (value === undefined) continue;
    keyValuePairs.set(stepConfig.label, value);
  }
  // If there are no configured inputs, add a "None" value.
  if (keyValuePairs.size === 0) {
    keyValuePairs.set("", "None");
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
export function getGenomeStrainText(
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
export function getGenomeSerotypeText(
  genome: BRCDataCatalogGenome | GA2AssemblyEntity,
  defaultValue = ""
): string {
  if (
    "taxonomicLevelSerotype" in genome &&
    genome.taxonomicLevelSerotype !== "None"
  )
    return genome.taxonomicLevelSerotype;
  return defaultValue;
}

/**
 * Get the genome isolate text.
 * @param genome - Genome entity.
 * @param defaultValue - Default value if no isolate is found.
 * @returns isolate text.
 */
export function getGenomeIsolateText(
  genome: BRCDataCatalogGenome | GA2AssemblyEntity,
  defaultValue = ""
): string {
  if (
    "taxonomicLevelIsolate" in genome &&
    genome.taxonomicLevelIsolate !== "None"
  )
    return genome.taxonomicLevelIsolate;
  return defaultValue;
}

/**
 * Get the organism entity breadcrumbs.
 * @param organism - Organism entity.
 * @returns Breadcrumbs.
 */
function getOrganismEntityBreadcrumbs(
  organism: BRCDataCatalogOrganism
): Breadcrumb[] {
  return [
    { path: ROUTES.ORGANISMS, text: "Organisms" },
    { path: "", text: organism.taxonomicLevelSpecies },
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
