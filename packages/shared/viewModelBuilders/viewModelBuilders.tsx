import { KeyElType } from "@databiosphere/findable-ui/lib/components/common/KeyValuePairs/components/KeyElType/keyElType";
import { ValueElType } from "@databiosphere/findable-ui/lib/components/common/KeyValuePairs/components/ValueElType/valueElType";
import type {
  Key,
  Value,
} from "@databiosphere/findable-ui/lib/components/common/KeyValuePairs/keyValuePairs";
import { type KeyValuePairs } from "@databiosphere/findable-ui/lib/components/common/KeyValuePairs/keyValuePairs";
import { Stack } from "@databiosphere/findable-ui/lib/components/common/Stack/stack";
import { Link } from "@databiosphere/findable-ui/lib/components/Links/components/Link/link";
import { type BasicCell } from "@databiosphere/findable-ui/lib/components/Table/components/TableCell/components/BasicCell/basicCell";
import { type ChipCell } from "@databiosphere/findable-ui/lib/components/Table/components/TableCell/components/ChipCell/chipCell";
import { type NTagCell } from "@databiosphere/findable-ui/lib/components/Table/components/TableCell/components/NTagCell/nTagCell";
import { CHIP_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/chip";
import { replaceParameters } from "@databiosphere/findable-ui/lib/utils/replaceParameters";
import type {
  AssemblyContract,
  OrganismContract,
} from "@repo/shared/apis/types";
import { sanitizeEntityId } from "@repo/shared/apis/utils";
import { CopyText } from "@repo/shared/components/CopyText/copyText";
import { ScientificName } from "@repo/shared/components/ScientificName/scientificName";
import { type AnalyzeGenome } from "@repo/shared/components/Table/components/TableCell/components/AnalyzeGenome/analyzeGenome";
import {
  LEVEL_FILLED_COUNT,
  LEVEL_LABEL,
} from "@repo/shared/components/Table/components/TableCell/components/LevelCell/constants";
import { type LevelCell } from "@repo/shared/components/Table/components/TableCell/components/LevelCell/levelCell";
import type { SpeciesTag } from "@repo/shared/components/Table/components/TableCell/components/SpeciesCell/types";
import { type Tooltip } from "@repo/shared/components/Tooltip/tooltip";
import { ROUTES } from "@repo/shared/routes/constants";
import { formatDate } from "@repo/shared/utils/date-fns/utils";
import { type AnalysisPortals } from "@repo/shared/views/EntityView/assembly/components/Side/AnalysisPortals/analysisPortals";
import { parseISO } from "date-fns";
import type { ComponentProps } from "react";
import {
  ENTITY_DETAIL_LABEL,
  GALAXY_DATACACHE,
  GENOME_BROWSER,
  NCBI_ASSEMBLY,
  NCBI_DATASETS_URL,
  NCBI_TAXONOMY,
  SPECIES_TAG_LABEL,
} from "./constants";

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
 * Build props for the genome analysis cell.
 * @param entity - Entity with an accession, ncbiTaxonomyId, and ucscBrowserUrl.
 * @returns Props to be used for the AnalyzeGenome component.
 */
export const buildAnalyzeGenome = (
  entity: AssemblyContract
): ComponentProps<typeof AnalyzeGenome> => {
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
 * Build props for the assembly details KeyValuePairs component.
 * @param assembly - Assembly entity.
 * @returns Props to be used for the KeyValuePairs component.
 */
export const buildAssemblyDetails = (
  assembly: AssemblyContract
): ComponentProps<typeof KeyValuePairs> => {
  const keyValuePairs = new Map<Key, Value>();
  keyValuePairs.set(
    ENTITY_DETAIL_LABEL.ACCESSION,
    <CopyText value={assembly.accession}>{assembly.accession}</CopyText>
  );
  return {
    KeyElType: KeyElType,
    KeyValuesElType: (props) => <Stack {...props} gap={4} />,
    ValueElType: ValueElType,
    keyValuePairs,
  };
};

/**
 * Build props for the assembly AnalysisPortals component.
 * @param entity - Entity with an accession, ucscBrowserUrl and ncbiTaxonomyId property.
 * @returns Props to be used for the AnalysisPortals component.
 */
export const buildAssemblyResources = (
  entity: AssemblyContract
): Pick<ComponentProps<typeof AnalysisPortals>, "portals"> => {
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
 * Build the taxonomic group tag, or null when there is no group.
 * @param taxonomicGroup - Taxonomic group values.
 * @returns Group tag, or null.
 */
export function buildGroupTag(taxonomicGroup: string[]): SpeciesTag | null {
  if (taxonomicGroup.length === 0) return null;
  const value = taxonomicGroup.join(", ");
  return { label: SPECIES_TAG_LABEL.GROUP, tooltip: value, value };
}

/**
 * Build props for the "is ref" cell.
 * @param entity - Entity with an isRef property.
 * @returns Props for the ChipCell component.
 */
export const buildIsRef = (
  entity: AssemblyContract
): ComponentProps<typeof ChipCell> => {
  return {
    getValue: () => ({
      color:
        entity.isRef.toLowerCase() === "yes"
          ? CHIP_PROPS.COLOR.SUCCESS
          : CHIP_PROPS.COLOR.DEFAULT,
      label: entity.isRef,
      variant: CHIP_PROPS.VARIANT.STATUS,
    }),
  } as ComponentProps<typeof ChipCell>;
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
 * Build props for the level cell — a tiered bar indicator plus the level label.
 * @param entity - Entity with a level property.
 * @returns Props for the LevelCell component.
 */
export const buildLevel = (
  entity: AssemblyContract
): ComponentProps<typeof LevelCell> => {
  return {
    filledCount: LEVEL_FILLED_COUNT[entity.level] ?? 0,
    label: LEVEL_LABEL[entity.level] ?? entity.level,
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
 * Build props for the organism details KeyValuePairs component. Shared core
 * covering the taxonomic levels common to every site; site-specific additions
 * (e.g. a priority-pathogen chip) are composed on top by each site.
 * @param organism - Organism details (mapped from an assembly or organism source).
 * @returns Props to be used for the KeyValuePairs component.
 */
export const buildOrganismDetails = (
  organism: OrganismContract
): ComponentProps<typeof KeyValuePairs> => {
  const {
    ncbiTaxonomyId,
    taxonomicLevelIsolate,
    taxonomicLevelSerotype,
    taxonomicLevelSpecies,
    taxonomicLevelStrain,
  } = organism;

  const keyValuePairs = new Map<Key, Value>();

  keyValuePairs.set(
    ENTITY_DETAIL_LABEL.TAXONOMIC_LEVEL_SPECIES,
    <Link
      label={<ScientificName>{taxonomicLevelSpecies}</ScientificName>}
      url={`${ROUTES.ORGANISMS}/${encodeURIComponent(sanitizeEntityId(ncbiTaxonomyId))}`}
    />
  );
  const taxonomicLevels: [Key, string[] | undefined][] = [
    [ENTITY_DETAIL_LABEL.TAXONOMIC_LEVEL_STRAIN, taxonomicLevelStrain],
    [ENTITY_DETAIL_LABEL.TAXONOMIC_LEVEL_SEROTYPE, taxonomicLevelSerotype],
    [ENTITY_DETAIL_LABEL.TAXONOMIC_LEVEL_ISOLATE, taxonomicLevelIsolate],
  ];
  for (const [label, values] of taxonomicLevels) {
    if (values?.length) keyValuePairs.set(label, values.join(", "));
  }

  return {
    KeyElType: KeyElType,
    KeyValuesElType: (props) => <Stack {...props} gap={4} />,
    ValueElType: ValueElType,
    keyValuePairs,
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
 * Build props for the release date cell, displaying the release year.
 * @param entity - Entity with a releaseDate property.
 * @returns Props for the BasicCell component.
 */
export const buildReleaseDate = (
  entity: AssemblyContract
): ComponentProps<typeof BasicCell> => {
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
  entity: AssemblyContract
): Omit<ComponentProps<typeof Tooltip>, "children"> => {
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
 * Format a number to a string.
 * @param value - Number to format.
 * @returns Formatted number or empty string if invalid.
 */
export function formatNumber(value: unknown): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "";
  return value.toLocaleString();
}

/**
 * Get the genome isolate text.
 * @param genome - Genome entity.
 * @param defaultValue - Default value if no isolate is found.
 * @returns isolate text.
 */
export function getGenomeIsolateText(
  genome: AssemblyContract,
  defaultValue = ""
): string {
  if (
    genome.taxonomicLevelIsolate !== undefined &&
    genome.taxonomicLevelIsolate !== "None"
  )
    return genome.taxonomicLevelIsolate;
  return defaultValue;
}

/**
 * Get the genome serotype text.
 * @param genome - Genome entity.
 * @param defaultValue - Default value if no serotype is found.
 * @returns serotype text.
 */
export function getGenomeSerotypeText(
  genome: AssemblyContract,
  defaultValue = ""
): string {
  if (
    genome.taxonomicLevelSerotype !== undefined &&
    genome.taxonomicLevelSerotype !== "None"
  )
    return genome.taxonomicLevelSerotype;
  return defaultValue;
}

/**
 * Get text for genome strain, consisting of, from highest to lowest priority, either: strain-only name; strain name including species; or the specified default value.
 * @param entity - Entity with a strainName and taxonomicLevelStrain property.
 * @param defaultValue - Default value to use if there's no strain.
 * @returns strain text.
 */
export function getGenomeStrainText(
  entity: AssemblyContract,
  defaultValue = ""
): string {
  if (entity.strainName) return entity.strainName;
  if (entity.taxonomicLevelStrain !== "None")
    return entity.taxonomicLevelStrain;
  return defaultValue;
}
