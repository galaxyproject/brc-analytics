import {
  BRCDataCatalogGenome,
  BRCDataCatalogOrganism,
  Outbreak,
  Workflow,
} from "@/apis/catalog/brc-analytics-catalog/common/entities";
import type { OUTBREAK_PRIORITY } from "@/apis/catalog/brc-analytics-catalog/common/schema-entities";
import {
  getGenomeOrganismId,
  getOrganismId,
} from "@/apis/catalog/brc-analytics-catalog/common/utils";
import type {
  AssemblyContract,
  OrganismContract,
} from "@/apis/catalog/common/entities";
import { SLUGIFY_OPTIONS } from "@/common/constants";
import { StepConfig } from "@/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/types";
import { KeyValueSection } from "@/components/Entity/components/Section/KeyValueSection/keyValueSection";
import { MDXSection } from "@/components/Entity/components/Section/MDXSection/mdxSection";
import { AnalyzeGenome } from "@/components/Table/components/TableCell/components/AnalyzeGenome/analyzeGenome";
import { LevelCell } from "@/components/Table/components/TableCell/components/LevelCell/levelCell";
import { TagList } from "@/components/Table/components/TableCell/components/SpeciesCell/components/TagList/tagList";
import { SpeciesCell } from "@/components/Table/components/TableCell/components/SpeciesCell/speciesCell";
import type { SpeciesTag } from "@/components/Table/components/TableCell/components/SpeciesCell/types";
import {
  ORGANISM_SCOPED_TAG_LABELS,
  SPECIES_TAG_LABEL,
} from "@/viewModelBuilders/catalog/common/constants";
import {
  buildAnalyzeGenome,
  buildAssemblyDetails,
  buildAssemblyResources,
  buildGroupTag,
  buildIsRef,
  buildLevel,
  buildOrganismDetails as buildOrganismDetailsBase,
  buildReleaseDate,
  buildReleaseDateTooltip,
  formatNumber,
  getGenomeIsolateText,
  getGenomeSerotypeText,
  getGenomeStrainText,
} from "@/viewModelBuilders/catalog/common/viewModelBuilders";
import {
  COLUMN_PRESET_KEY,
  COLUMN_PRESET_LABEL,
} from "@/views/OrganismView/components/Main/constants";
import { Main as OrganismViewMain } from "@/views/OrganismView/components/Main/main";
import { Tabs } from "@/views/OrganismView/components/Tabs/tabs";
import type { Organism } from "@/views/OrganismView/types";
import {
  getPriorityColor,
  getPriorityLabel,
} from "@/views/PriorityPathogensView/components/PriorityPathogens/utils";
import { ResourcesSection } from "@/views/PriorityPathogenView/components/ResourcesSection/resourcesSection";
import { ConfiguredInput } from "@/views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import { AppLink } from "@brc-analytics/core/components/common/AppLink/appLink";
import { Chip } from "@brc-analytics/core/components/common/Chip/chip";
import { Tooltip } from "@brc-analytics/core/components/common/Tooltip/tooltip";
import { Breadcrumb } from "@databiosphere/findable-ui/lib/components/common/Breadcrumbs/breadcrumbs";
import { KeyElType } from "@databiosphere/findable-ui/lib/components/common/KeyValuePairs/components/KeyElType/keyElType";
import { ValueElType } from "@databiosphere/findable-ui/lib/components/common/KeyValuePairs/components/ValueElType/valueElType";
import {
  Key,
  KeyValuePairs,
  Value,
} from "@databiosphere/findable-ui/lib/components/common/KeyValuePairs/keyValuePairs";
import { Stack } from "@databiosphere/findable-ui/lib/components/common/Stack/stack";
import { TypographyWordBreak } from "@databiosphere/findable-ui/lib/components/common/Typography/TypographyWordBreak/TypographyWordBreak";
import { BackPageHero } from "@databiosphere/findable-ui/lib/components/Layout/components/BackPage/components/BackPageHero/backPageHero";
import { Link } from "@databiosphere/findable-ui/lib/components/Links/components/Link/link";
import { COLUMN_IDENTIFIER } from "@databiosphere/findable-ui/lib/components/Table/common/columnIdentifier";
import { BasicCell } from "@databiosphere/findable-ui/lib/components/Table/components/TableCell/components/BasicCell/basicCell";
import { ChipCell } from "@databiosphere/findable-ui/lib/components/Table/components/TableCell/components/ChipCell/chipCell";
import { NTagCell } from "@databiosphere/findable-ui/lib/components/Table/components/TableCell/components/NTagCell/nTagCell";
import { CHIP_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/chip";
import {
  BRC_DATA_CATALOG_CATEGORY_KEY,
  BRC_DATA_CATALOG_CATEGORY_LABEL,
} from "@site-config/brc-analytics/category";
import { ColumnDef, RowData, VisibilityState } from "@tanstack/react-table";
import { LinkProps } from "next/link";
import Router from "next/router";
import { ComponentProps } from "react";
import slugify from "slugify";
import { ROUTES } from "../../../../../routes/constants";

// Transitional shim for the GA2/BRC split (monorepo-split): shared builders
// moved to the site-neutral common home. Re-export them from this BRC path so
// existing BRC importers keep resolving; repoint importers at
// @/viewModelBuilders/catalog/common and drop these re-exports, then remove.
export {
  buildAnalyzeGenome,
  buildAssemblyDetails,
  buildAssemblyResources,
  buildGroupTag,
  buildIsRef,
  buildLevel,
  buildReleaseDate,
  buildReleaseDateTooltip,
  formatNumber,
  getGenomeIsolateText,
  getGenomeSerotypeText,
  getGenomeStrainText,
};

/**
 * Build props for the accession cell.
 * @param entity - Entity with an accession.
 * @returns Props to be used for the cell.
 */
export const buildAccession = (
  entity: AssemblyContract
): ComponentProps<typeof BasicCell> => {
  return {
    value: entity.accession,
  };
};

/**
 * Build props for the annotation status cell.
 * @param entity - Entity with an annotationStatus property.
 * @returns Props for the BasicCell component.
 */
export const buildAnnotationStatus = (
  entity: AssemblyContract
): ComponentProps<typeof BasicCell> => {
  return {
    value: entity.annotationStatus,
  };
};

/**
 * Build props for the assemblies cell.
 * @param entity - Entity with a required assemblyCount property.
 * @returns Props for the BasicCell component.
 */
export const buildAssemblyCount = (
  // `assemblyCount` is optional on OrganismContract; require it here so callers
  // can't pass a projection without it and silently render an empty value.
  entity: OrganismContract & { assemblyCount: number }
): ComponentProps<typeof BasicCell> => {
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
  entity: AssemblyContract
): ComponentProps<typeof BasicCell> => {
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
): ComponentProps<typeof BasicCell> => {
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
  entity: AssemblyContract
): ComponentProps<typeof BasicCell> => {
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
  entity: AssemblyContract
): ComponentProps<typeof BasicCell> => {
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
): ComponentProps<typeof SpeciesCell> => {
  const tags: SpeciesTag[] = [];
  const strain = getGenomeStrainText(genome);
  if (strain) tags.push({ label: "strain", tooltip: strain, value: strain });
  const serotype = getGenomeSerotypeText(genome);
  if (serotype)
    tags.push({ label: "serotype", tooltip: serotype, value: serotype });
  const isolate = getGenomeIsolateText(genome);
  if (isolate)
    tags.push({ label: "isolate", tooltip: isolate, value: isolate });
  const groupTag = buildGroupTag(genome.taxonomicGroup);
  if (groupTag) tags.push(groupTag);
  const priorityTag = buildPriorityTag(
    genome.priority,
    genome.priorityPathogenName
  );
  if (priorityTag) tags.push(priorityTag);
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
 * Build the priority pathogen tag, or null when the entity has no priority.
 * @param priority - Outbreak priority.
 * @param priorityPathogenName - Priority pathogen name (tag tooltip).
 * @returns Priority tag, or null.
 */
function buildPriorityTag(
  priority: OUTBREAK_PRIORITY | null,
  priorityPathogenName: string | null
): SpeciesTag | null {
  if (!priority) return null;
  return {
    color: getPriorityColor(priority),
    label: SPECIES_TAG_LABEL.PRIORITY,
    tooltip: priorityPathogenName ?? undefined,
    value: priority.toLowerCase().replace(/_/g, " "),
  };
}

/**
 * Build props for the species cell on the organism detail page assembly table.
 * The accession is the cell's primary (unlinked) label — the species name is
 * redundant on a single-organism page and moves to the hero title. The
 * organism-scoped tags (group, priority) are dropped here as they move to the
 * hero; only per-assembly tags (strain, serotype, isolate) remain.
 * @param genome - Genome entity.
 * @returns Props to be used for the SpeciesCell component.
 */
export const buildOrganismGenomeSpecies = (
  genome: BRCDataCatalogGenome
): ComponentProps<typeof SpeciesCell> => {
  const props = buildGenomeSpecies(genome);
  return {
    ...props,
    // Accession replaces the species name as the cell's primary text (rendered
    // as plain text — no link). Organism-scoped tags move to the page header.
    species: { label: genome.accession, url: "" },
    tags: props.tags?.filter(
      ({ label }) => !ORGANISM_SCOPED_TAG_LABELS.includes(label)
    ),
  };
};

/**
 * Build props for the strain cell.
 * @param entity - Entity with a strainName and taxonomicLevelStrain property.
 * @returns Props to be used for the BasicCell component.
 */
export const buildGenomeTaxonomicLevelStrain = (
  entity: AssemblyContract
): ComponentProps<typeof BasicCell> => {
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
): ComponentProps<typeof BasicCell> => {
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
): ComponentProps<typeof BasicCell> => {
  return {
    value: getGenomeIsolateText(genome),
  };
};

/**
 * Build props for the length cell.
 * @param entity - Entity with a length property.
 * @returns Props for the BasicCell component.
 */
export const buildLength = (
  entity: AssemblyContract
): ComponentProps<typeof BasicCell> => {
  return {
    value: formatNumber(entity.length),
  };
};

/**
 * Build props for the assembly taxonomy IDs cell.
 * @param entity - Entity with a assemblyTaxonomyIds property.
 * @returns Props for the NTagCell component.
 */
export const buildOrganismAssemblyTaxonomyIds = (
  entity: OrganismContract
): ComponentProps<typeof NTagCell> => {
  return {
    label: "taxonomy IDs",
    values: entity.assemblyTaxonomyIds ?? [],
  };
};

/**
 * Build props for the organism details KeyValuePairs component. Composes the
 * shared taxonomic-level core and appends the BRC-only priority-pathogen chip
 * when the organism is a priority pathogen.
 * @param organism - Organism details (mapped from an assembly or organism source).
 * @returns Props to be used for the KeyValuePairs component.
 */
export const buildOrganismDetails = (
  organism: Organism
): ComponentProps<typeof KeyValuePairs> => {
  const details = buildOrganismDetailsBase(organism);
  if (organism.priorityPathogenName) {
    details.keyValuePairs?.set(
      BRC_DATA_CATALOG_CATEGORY_LABEL.PRIORITY_PATHOGEN_NAME,
      <Chip {...buildPriorityPathogen(organism)} />
    );
  }
  return details;
};

/**
 * Build props for the species cell.
 * @param organism - Organism entity.
 * @returns Props to be used for the cell.
 */
export const buildOrganismTaxonomicLevelSpecies = (
  organism: BRCDataCatalogOrganism
): ComponentProps<typeof Link> => {
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
): ComponentProps<typeof NTagCell> => {
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
): ComponentProps<typeof NTagCell> => {
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
): ComponentProps<typeof NTagCell> => {
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
): ComponentProps<typeof BasicCell> => {
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
}): ComponentProps<typeof Chip> => {
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
): Omit<ComponentProps<typeof Tooltip>, "children"> => {
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
): ComponentProps<typeof BackPageHero> => {
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
): ComponentProps<typeof MDXSection> => {
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
    <Chip
      color={getPriorityColor(priorityPathogen.priority)}
      label={getPriorityLabel(priorityPathogen.priority)}
      onClick={(): void => {
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
      }}
      variant={CHIP_PROPS.VARIANT.STATUS}
    />
  );
  [
    ["Organisms", ROUTES.ORGANISMS],
    ["Assemblies", ROUTES.GENOMES],
  ].forEach(([key, pathname]) => {
    keyValuePairs.set(
      key,
      <AppLink
        href={getEntityLinkWithPriorityPathogenFilter(
          priorityPathogen,
          pathname
        )}
      >
        {priorityPathogen.taxonName}
      </AppLink>
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
 * Build props for the taxonomic group cell of an assembly.
 * @param entity - Assembly with a taxonomicGroup property.
 * @returns Props for the NTagCell component.
 */
export const buildAssemblyTaxonomicGroup = (
  entity: AssemblyContract
): ComponentProps<typeof NTagCell> => {
  return {
    label: "taxonomic groups",
    values: entity.taxonomicGroup,
  };
};

/**
 * Build props for the taxonomic group cell of an organism.
 * @param entity - Organism with an optional taxonomicGroup property.
 * @returns Props for the NTagCell component.
 */
export const buildOrganismTaxonomicGroup = (
  entity: OrganismContract
): ComponentProps<typeof NTagCell> => {
  return {
    label: "taxonomic groups",
    values: entity.taxonomicGroup ?? [],
  };
};

/**
 * Build props for the class cell.
 * @param entity - Entity with a taxonomicLevelClass property.
 * @param entity.taxonomicLevelClass - Taxonomic class.
 * @returns Props to be used for the cell.
 */
export const buildTaxonomicLevelClass = (entity: {
  taxonomicLevelClass: string;
}): ComponentProps<typeof BasicCell> => {
  return {
    value: entity.taxonomicLevelClass,
  };
};

/**
 * Build props for the domain cell.
 * @param entity - Entity with a taxonomicLevelDomain property.
 * @param entity.taxonomicLevelDomain - Taxonomic domain.
 * @returns Props to be used for the cell.
 */
export const buildTaxonomicLevelDomain = (entity: {
  taxonomicLevelDomain: string;
}): ComponentProps<typeof BasicCell> => {
  return {
    value: entity.taxonomicLevelDomain,
  };
};

/**
 * Build props for the family cell.
 * @param entity - Entity with a taxonomicLevelFamily property.
 * @param entity.taxonomicLevelFamily - Taxonomic family.
 * @returns Props to be used for the cell.
 */
export const buildTaxonomicLevelFamily = (entity: {
  taxonomicLevelFamily: string;
}): ComponentProps<typeof BasicCell> => {
  return {
    value: entity.taxonomicLevelFamily,
  };
};

/**
 * Build props for the genus cell.
 * @param entity - Entity with a taxonomicLevelGenus property.
 * @param entity.taxonomicLevelGenus - Taxonomic genus.
 * @returns Props to be used for the cell.
 */
export const buildTaxonomicLevelGenus = (entity: {
  taxonomicLevelGenus: string;
}): ComponentProps<typeof BasicCell> => {
  return {
    value: entity.taxonomicLevelGenus,
  };
};

/**
 * Build props for the kingdom cell.
 * @param entity - Entity with a taxonomicLevelKingdom property.
 * @param entity.taxonomicLevelKingdom - Taxonomic kingdom.
 * @returns Props to be used for the cell.
 */
export const buildTaxonomicLevelKingdom = (entity: {
  taxonomicLevelKingdom: string;
}): ComponentProps<typeof BasicCell> => {
  return {
    value: entity.taxonomicLevelKingdom,
  };
};

/**
 * Build props for the order cell.
 * @param entity - Entity with a taxonomicLevelOrder property.
 * @param entity.taxonomicLevelOrder - Taxonomic order.
 * @returns Props to be used for the cell.
 */
export const buildTaxonomicLevelOrder = (entity: {
  taxonomicLevelOrder: string;
}): ComponentProps<typeof BasicCell> => {
  return {
    value: entity.taxonomicLevelOrder,
  };
};

/**
 * Build props for the phylum cell.
 * @param entity - Entity with a taxonomicLevelPhylum property.
 * @param entity.taxonomicLevelPhylum - Taxonomic phylum.
 * @returns Props to be used for the cell.
 */
export const buildTaxonomicLevelPhylum = (entity: {
  taxonomicLevelPhylum: string;
}): ComponentProps<typeof BasicCell> => {
  return {
    value: entity.taxonomicLevelPhylum,
  };
};

/**
 * Build props for the realm cell.
 * @param entity - Entity with a taxonomicLevelRealm property.
 * @param entity.taxonomicLevelRealm - Taxonomic realm.
 * @returns Props to be used for the cell.
 */
export const buildTaxonomicLevelRealm = (entity: {
  taxonomicLevelRealm: string;
}): ComponentProps<typeof BasicCell> => {
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
  entity: AssemblyContract
): ComponentProps<typeof BasicCell> => {
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
  entity: AssemblyContract
): ComponentProps<typeof BasicCell> => {
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
  entity: AssemblyContract
): ComponentProps<typeof BasicCell> => {
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
  entity: AssemblyContract
): ComponentProps<typeof BasicCell> => {
  return {
    value: entity.ncbiTaxonomyId,
  };
};

/**
 * Build props for the organism BackPageHero component.
 * @param organism - Organism entity.
 * @returns Props to be used for the BackPageHero component.
 */
export const buildOrganismHero = (
  organism: BRCDataCatalogOrganism
): ComponentProps<typeof BackPageHero> => {
  // The species/group/priority are constant across the organism's assemblies,
  // so surface group + priority as header chips rather than repeating them on
  // every assembly row.
  const tags: SpeciesTag[] = [];
  const groupTag = buildGroupTag(organism.taxonomicGroup);
  if (groupTag) tags.push(groupTag);
  const priorityTag = buildPriorityTag(
    organism.priority,
    organism.priorityPathogenName
  );
  if (priorityTag) tags.push(priorityTag);
  return {
    breadcrumbs: getOrganismEntityBreadcrumbs(organism),
    children: <Tabs ncbiTaxonomyId={organism.ncbiTaxonomyId} />,
    subTitle: tags.length > 0 ? <TagList tags={tags} /> : undefined,
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
): ComponentProps<typeof OrganismViewMain> => {
  return {
    assembly: {
      columnPresets: ORGANISM_GENOMES_COLUMN_PRESETS,
      tableOptions: buildOrganismGenomesTable(organism),
    },
    entityId: getOrganismId(organism),
    organism,
  };
};

/**
 * Complete visibility state for the Default preset, also used as the table's
 * initial state. Columns not listed here are shown; the internal row-position
 * column is always hidden.
 */
const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
  [COLUMN_IDENTIFIER.ROW_POSITION]: false,
  [BRC_DATA_CATALOG_CATEGORY_KEY.CHROMOSOMES]: false,
  [BRC_DATA_CATALOG_CATEGORY_KEY.COVERAGE]: false,
  [BRC_DATA_CATALOG_CATEGORY_KEY.GC_PERCENT]: false,
  [BRC_DATA_CATALOG_CATEGORY_KEY.SCAFFOLD_COUNT]: false,
  [BRC_DATA_CATALOG_CATEGORY_KEY.SCAFFOLD_L50]: false,
  [BRC_DATA_CATALOG_CATEGORY_KEY.SCAFFOLD_N50]: false,
};

/**
 * The column presets (Default, Quality) for the organism genomes table. Each
 * preset's complete visibility state is applied via table.setColumnVisibility
 * on toggle; columns not listed are shown.
 */
const ORGANISM_GENOMES_COLUMN_PRESETS: ComponentProps<
  typeof OrganismViewMain
>["assembly"]["columnPresets"] = [
  {
    columnVisibility: DEFAULT_COLUMN_VISIBILITY,
    key: COLUMN_PRESET_KEY.DEFAULT,
    label: COLUMN_PRESET_LABEL.DEFAULT,
  },
  {
    columnVisibility: {
      [COLUMN_IDENTIFIER.ROW_POSITION]: false,
      [BRC_DATA_CATALOG_CATEGORY_KEY.ANNOTATION_STATUS]: false,
      [BRC_DATA_CATALOG_CATEGORY_KEY.IS_REF]: false,
      [BRC_DATA_CATALOG_CATEGORY_KEY.LENGTH]: false,
      [BRC_DATA_CATALOG_CATEGORY_KEY.RELEASE_DATE]: false,
    },
    key: COLUMN_PRESET_KEY.QUALITY,
    label: COLUMN_PRESET_LABEL.QUALITY,
  },
];

/**
 * Build table options (columns, data, initial state) for the genomes table for the given organism.
 * @param organism - Organism entity with genomes to be displayed in the table.
 * @returns table options.
 */
export function buildOrganismGenomesTable(
  organism: BRCDataCatalogOrganism
): ComponentProps<typeof OrganismViewMain>["assembly"]["tableOptions"] {
  return {
    // Cast: ColumnDef<T> is invariant in T, so the catalog-specific row type
    // cannot widen to RowData even though BRCDataCatalogGenome extends it.
    columns: buildOrganismGenomesTableColumns() as ColumnDef<RowData>[],
    data: organism.genomes,
    initialState: {
      // Mount on the Default preset so the table matches the toggle.
      columnVisibility: DEFAULT_COLUMN_VISIBILITY,
      sorting: [
        { desc: true, id: BRC_DATA_CATALOG_CATEGORY_KEY.IS_REF },
        { desc: false, id: BRC_DATA_CATALOG_CATEGORY_KEY.ACCESSION },
      ],
    },
  };
}

/**
 * Header for the pinned species column on the organism detail table: relabelled
 * "Assembly" since the cell's primary text is the assembly accession.
 */
const ASSEMBLY_COLUMN_HEADER = "Assembly";

/**
 * Build the column definitions for the organism genomes table.
 * @returns column definitions.
 */
function buildOrganismGenomesTableColumns(): ColumnDef<BRCDataCatalogGenome>[] {
  return [
    {
      accessorKey: BRC_DATA_CATALOG_CATEGORY_KEY.ANALYZE_GENOME,
      cell: ({ row }) => (
        <AnalyzeGenome {...buildAnalyzeGenome(row.original)} />
      ),
      enableSorting: false,
      header: BRC_DATA_CATALOG_CATEGORY_LABEL.ANALYZE_GENOME,
      meta: {
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.ANALYZE_GENOME,
        width: "auto",
      },
    },
    {
      // Keyed on accession so the pinned "Assembly" column sorts by accession
      // (its primary text); the SpeciesCell renders the accession + per-assembly
      // tags.
      accessorKey: BRC_DATA_CATALOG_CATEGORY_KEY.ACCESSION,
      cell: ({ row }) => (
        <SpeciesCell {...buildOrganismGenomeSpecies(row.original)} />
      ),
      header: ASSEMBLY_COLUMN_HEADER,
      meta: {
        columnPinned: true,
        header: ASSEMBLY_COLUMN_HEADER,
        width: { max: "0.75fr", min: "176px" },
      },
    },
    {
      accessorKey: BRC_DATA_CATALOG_CATEGORY_KEY.RELEASE_DATE,
      cell: ({ row }) => (
        <Tooltip {...buildReleaseDateTooltip(row.original)}>
          <BasicCell {...buildReleaseDate(row.original)} />
        </Tooltip>
      ),
      header: BRC_DATA_CATALOG_CATEGORY_LABEL.RELEASE_DATE,
      meta: {
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.RELEASE_DATE,
        width: { max: "0.5fr", min: "120px" },
      },
    },
    {
      accessorKey: BRC_DATA_CATALOG_CATEGORY_KEY.IS_REF,
      cell: ({ row }) => <ChipCell {...buildIsRef(row.original)} />,
      header: BRC_DATA_CATALOG_CATEGORY_LABEL.IS_REF,
      meta: {
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.IS_REF,
        width: { max: "0.5fr", min: "100px" },
      },
    },
    {
      accessorKey: BRC_DATA_CATALOG_CATEGORY_KEY.LEVEL,
      cell: ({ row }) => <LevelCell {...buildLevel(row.original)} />,
      header: BRC_DATA_CATALOG_CATEGORY_LABEL.LEVEL,
      meta: {
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.LEVEL,
        width: { max: "0.5fr", min: "142px" },
      },
    },
    {
      accessorKey: BRC_DATA_CATALOG_CATEGORY_KEY.CHROMOSOMES,
      cell: ({ row }) => <BasicCell {...buildChromosomes(row.original)} />,
      header: BRC_DATA_CATALOG_CATEGORY_LABEL.CHROMOSOMES,
      meta: {
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.CHROMOSOMES,
        width: { max: "0.5fr", min: "142px" },
      },
    },
    {
      accessorKey: BRC_DATA_CATALOG_CATEGORY_KEY.LENGTH,
      cell: ({ row }) => <BasicCell {...buildLength(row.original)} />,
      header: BRC_DATA_CATALOG_CATEGORY_LABEL.LENGTH,
      meta: {
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.LENGTH,
        width: { max: "0.5fr", min: "132px" },
      },
    },
    {
      accessorKey: BRC_DATA_CATALOG_CATEGORY_KEY.SCAFFOLD_COUNT,
      cell: ({ row }) => <BasicCell {...buildScaffoldCount(row.original)} />,
      header: BRC_DATA_CATALOG_CATEGORY_LABEL.SCAFFOLD_COUNT,
      meta: {
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.SCAFFOLD_COUNT,
        width: { max: "0.5fr", min: "116px" },
      },
    },
    {
      accessorKey: BRC_DATA_CATALOG_CATEGORY_KEY.SCAFFOLD_N50,
      cell: ({ row }) => <BasicCell {...buildScaffoldN50(row.original)} />,
      header: BRC_DATA_CATALOG_CATEGORY_LABEL.SCAFFOLD_N50,
      meta: {
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.SCAFFOLD_N50,
        width: { max: "0.5fr", min: "116px" },
      },
    },
    {
      accessorKey: BRC_DATA_CATALOG_CATEGORY_KEY.SCAFFOLD_L50,
      cell: ({ row }) => <BasicCell {...buildScaffoldL50(row.original)} />,
      header: BRC_DATA_CATALOG_CATEGORY_LABEL.SCAFFOLD_L50,
      meta: {
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.SCAFFOLD_L50,
        width: { max: "0.5fr", min: "116px" },
      },
    },
    {
      accessorKey: BRC_DATA_CATALOG_CATEGORY_KEY.COVERAGE,
      cell: ({ row }) => <BasicCell {...buildCoverage(row.original)} />,
      header: BRC_DATA_CATALOG_CATEGORY_LABEL.COVERAGE,
      meta: {
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.COVERAGE,
        width: { max: "0.5fr", min: "116px" },
      },
    },
    {
      accessorKey: BRC_DATA_CATALOG_CATEGORY_KEY.GC_PERCENT,
      cell: ({ row }) => <BasicCell {...buildGcPercent(row.original)} />,
      header: BRC_DATA_CATALOG_CATEGORY_LABEL.GC_PERCENT,
      meta: {
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.GC_PERCENT,
        width: { max: "0.5fr", min: "116px" },
      },
    },
    {
      accessorKey: BRC_DATA_CATALOG_CATEGORY_KEY.ANNOTATION_STATUS,
      cell: ({ row }) => <BasicCell {...buildAnnotationStatus(row.original)} />,
      header: BRC_DATA_CATALOG_CATEGORY_LABEL.ANNOTATION_STATUS,
      meta: {
        header: BRC_DATA_CATALOG_CATEGORY_LABEL.ANNOTATION_STATUS,
        width: { max: "0.5fr", min: "140px" },
      },
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
): ComponentProps<typeof KeyValuePairs> => {
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
    KeyElType: KeyElType,
    KeyValuesElType: (props) => <Stack {...props} gap={4} />,
    ValueElType: TypographyWordBreak,
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
): ComponentProps<typeof KeyValuePairs> => {
  const keyValuePairs = new Map<Key, Value>();
  keyValuePairs.set("Workflow", workflow.workflowName);
  keyValuePairs.set("Description", workflow.workflowDescription);
  return {
    KeyElType: KeyElType,
    KeyValuesElType: (props) => <Stack {...props} gap={4} />,
    ValueElType: ValueElType,
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
