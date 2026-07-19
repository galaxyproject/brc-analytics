import type {
  AssemblyContract,
  OrganismContract,
} from "@/apis/catalog/common/entities";
import { sanitizeEntityId } from "@/apis/catalog/common/utils";
import { CopyText } from "@/components/common/CopyText/copyText";
import { Tooltip } from "@/components/common/Tooltip/tooltip";
import { AnalysisPortals } from "@/components/Entity/components/AnalysisPortals/analysisPortals";
import { AnalyzeGenome } from "@/components/Table/components/TableCell/components/AnalyzeGenome/analyzeGenome";
import {
  LEVEL_FILLED_COUNT,
  LEVEL_LABEL,
} from "@/components/Table/components/TableCell/components/LevelCell/constants";
import { LevelCell } from "@/components/Table/components/TableCell/components/LevelCell/levelCell";
import type { SpeciesTag } from "@/components/Table/components/TableCell/components/SpeciesCell/types";
import { formatDate } from "@/utils/date-fns";
import { KeyElType } from "@databiosphere/findable-ui/lib/components/common/KeyValuePairs/components/KeyElType/keyElType";
import { ValueElType } from "@databiosphere/findable-ui/lib/components/common/KeyValuePairs/components/ValueElType/valueElType";
import {
  Key,
  KeyValuePairs,
  Value,
} from "@databiosphere/findable-ui/lib/components/common/KeyValuePairs/keyValuePairs";
import { Stack } from "@databiosphere/findable-ui/lib/components/common/Stack/stack";
import { Link } from "@databiosphere/findable-ui/lib/components/Links/components/Link/link";
import { BasicCell } from "@databiosphere/findable-ui/lib/components/Table/components/TableCell/components/BasicCell/basicCell";
import { ChipCell } from "@databiosphere/findable-ui/lib/components/Table/components/TableCell/components/ChipCell/chipCell";
import { CHIP_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/chip";
import { replaceParameters } from "@databiosphere/findable-ui/lib/utils/replaceParameters";
import { parseISO } from "date-fns";
import { ComponentProps } from "react";
import { ROUTES } from "../../../../routes/constants";
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
 * Build props for the organism details KeyValuePairs component. Shared core
 * covering the taxonomic levels common to every site; site-specific additions
 * (e.g. the BRC priority-pathogen chip) are composed on top by each site.
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
      label={taxonomicLevelSpecies}
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
