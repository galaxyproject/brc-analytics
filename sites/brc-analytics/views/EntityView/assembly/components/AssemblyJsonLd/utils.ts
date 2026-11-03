import { type BRCDataCatalogGenome } from "@brc/apis/assembly";
import { getGenomeId } from "@brc/apis/utils";
import { replaceParameters } from "@databiosphere/findable-ui/lib/utils/replaceParameters";
import { ENVIRONMENT, getEnvironment } from "@repo/shared/config/environment";
import { ROUTES } from "@repo/shared/routes/constants";
import { buildFastaUrl } from "@repo/shared/utils/galaxy-api/url-utils";
import { NCBI_DATASETS_URL } from "@repo/shared/viewModelBuilders/constants";
import {
  DESCRIPTION_LOCALE,
  DOWNLOAD_ENCODING_FORMAT,
  GENE_MODEL_NAME,
  GENOME_SEQUENCE_NAME,
  MAX_DESCRIPTION_LENGTH,
  MISSING_TAXONOMIC_LEVEL,
  VARIABLES_MEASURED,
} from "./constants";
import {
  type SchemaDataDownload,
  type SchemaDataset,
  type SchemaPropertyValue,
} from "./types";

/**
 * Builds an assembly's schema.org Dataset record, for Google Dataset Search.
 * BRC Analytics is named as the provider: the catalog doesn't record who made
 * the assembly.
 * @param assembly - Assembly.
 * @param browserURL - The site's address.
 * @param appTitle - The site's name.
 * @returns The Dataset record.
 */
export function buildAssemblyJsonLd(
  assembly: BRCDataCatalogGenome,
  browserURL: string,
  appTitle: string
): SchemaDataset {
  const { accession, releaseDate, ucscBrowserUrl } = assembly;
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    datePublished: releaseDate,
    description: buildDescription(assembly),
    distribution: buildDistribution(assembly),
    identifier: accession,
    includedInDataCatalog: {
      "@type": "DataCatalog",
      name: appTitle,
      url: browserURL,
    },
    isAccessibleForFree: true,
    keywords: buildKeywords(assembly),
    name: buildName(assembly),
    provider: { "@type": "Organization", name: appTitle, url: browserURL },
    sameAs: [
      `${NCBI_DATASETS_URL}/genome/${accession}`,
      ...(ucscBrowserUrl ? [ucscBrowserUrl] : []),
    ],
    url: `${browserURL}${replaceParameters(ROUTES.GENOME, {
      entityId: getGenomeId(assembly),
    })}`,
    variableMeasured: buildVariableMeasured(assembly),
    version: parseVersion(accession),
  };
}

/**
 * Describes an assembly in a sentence: its organism, accession, level, counts
 * and length.
 * @param assembly - Assembly.
 * @returns E.g. "Genome assembly GCA_000002825.3 of Trichomonas vaginalis G3,
 * at scaffold level, with 64,769 scaffolds, totaling 176,420,065 bp."
 */
export function buildDescription(assembly: BRCDataCatalogGenome): string {
  const {
    accession,
    chromosomes,
    length,
    level,
    scaffoldCount,
    strainName,
    taxonomicLevelSpecies,
  } = assembly;
  const organism = strainName
    ? `${taxonomicLevelSpecies} ${strainName}`
    : taxonomicLevelSpecies;
  const counts = [
    countOf(chromosomes, "chromosome"),
    countOf(scaffoldCount, "scaffold"),
  ].filter(Boolean);
  const description = [
    `Genome assembly ${accession} of ${organism}`,
    `at ${level.toLowerCase()} level`,
    ...(counts.length > 0 ? [`with ${counts.join(" and ")}`] : []),
    `totaling ${length.toLocaleString(DESCRIPTION_LOCALE)} bp.`,
  ].join(", ");
  return truncateDescription(description);
}

/**
 * The assembly's downloads: its genome sequence (FASTA), then its gene model
 * (GTF) when it has one, both from the UCSC Genome Browser's downloads.
 * @param assembly - Assembly.
 * @returns The downloads.
 */
function buildDistribution(
  assembly: BRCDataCatalogGenome
): SchemaDataDownload[] {
  const { accession, geneModelUrl } = assembly;
  return [
    buildDownload(buildFastaUrl(accession), GENOME_SEQUENCE_NAME),
    ...(geneModelUrl ? [buildDownload(geneModelUrl, GENE_MODEL_NAME)] : []),
  ];
}

/**
 * A gzipped download from the UCSC Genome Browser's downloads.
 * @param contentUrl - The file's address.
 * @param name - The download's name.
 * @returns The download.
 */
function buildDownload(contentUrl: string, name: string): SchemaDataDownload {
  return {
    "@type": "DataDownload",
    contentUrl,
    encodingFormat: DOWNLOAD_ENCODING_FORMAT,
    name,
  };
}

/**
 * The assembly's keywords: its priority pathogen name, taxonomic groups and
 * taxonomy, without blanks, missing levels or repeats.
 * @param assembly - Assembly.
 * @returns The keywords.
 */
function buildKeywords(assembly: BRCDataCatalogGenome): string[] {
  const keywords = [
    assembly.priorityPathogenName,
    ...assembly.taxonomicGroup,
    assembly.taxonomicLevelKingdom,
    assembly.taxonomicLevelFamily,
    assembly.taxonomicLevelGenus,
    assembly.taxonomicLevelSpecies,
  ].filter(
    (keyword): keyword is string =>
      Boolean(keyword) && keyword !== MISSING_TAXONOMIC_LEVEL
  );
  return [...new Set(keywords)];
}

/**
 * The assembly's name: its species, strain if it has one, and accession. The
 * strain is the catalog's strain name, not its strain-level taxon, which
 * repeats the species (e.g. "Trichomonas vaginalis strain G3").
 * @param assembly - Assembly.
 * @returns E.g. "Trichomonas vaginalis — G3 (GCA_000002825.3)".
 */
function buildName(assembly: BRCDataCatalogGenome): string {
  const { accession, strainName, taxonomicLevelSpecies } = assembly;
  const strain = strainName ? ` — ${strainName}` : "";
  return `${taxonomicLevelSpecies}${strain} (${accession})`;
}

/**
 * The assembly's statistics that have a value, with their units.
 * @param assembly - Assembly.
 * @returns The statistics.
 */
function buildVariableMeasured(
  assembly: BRCDataCatalogGenome
): SchemaPropertyValue[] {
  return VARIABLES_MEASURED.flatMap((variable) => {
    const value = assembly[variable.key];
    if (value == null) return [];
    return [
      {
        "@type": "PropertyValue" as const,
        name: variable.name,
        ...("unitText" in variable ? { unitText: variable.unitText } : {}),
        value: toNumber(value, variable.name),
      },
    ];
  });
}

/**
 * A count with its noun, e.g. "1 chromosome" or "14 chromosomes".
 * @param count - Count, or null when unknown.
 * @param noun - Singular noun.
 * @returns The phrase, or null when the count is unknown or zero.
 */
function countOf(count: number | null, noun: string): string | null {
  if (!count) return null;
  return `${count.toLocaleString(DESCRIPTION_LOCALE)} ${noun}${count === 1 ? "" : "s"}`;
}

/**
 * The version in an assembly accession, e.g. "3" for "GCA_000002825.3". Every
 * catalog accession has one, so one without fails the build.
 * @param accession - Assembly accession.
 * @returns The version.
 */
function parseVersion(accession: string): string {
  const version = accession.match(/\.(\d+)$/)?.[1];
  if (!version)
    throw new Error(`Assembly accession ${accession} has no version`);
  return version;
}

/**
 * Serializes a JSON-LD record for a script tag, escaping the characters that
 * could close the tag or start an HTML entity.
 * @param jsonLd - JSON-LD record.
 * @returns The escaped JSON.
 */
export function serializeJsonLd(jsonLd: SchemaDataset): string {
  return JSON.stringify(jsonLd)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

/**
 * A statistic as a number. The catalog writes coverage as text (e.g. "7.2"),
 * always a number, so text that isn't one fails the build.
 * @param value - Statistic.
 * @param name - Statistic name, for the error message.
 * @returns The number.
 */
function toNumber(value: number | string, name: string): number {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new Error(`Assembly statistic ${name} is not a number: "${value}"`);
  }
  return number;
}

/**
 * Whether the site publishes its assemblies' Dataset records: in production
 * only, so search engines don't list dev or local copies of the catalog.
 * @returns True in production.
 */
export function shouldPublishDatasetRecords(): boolean {
  return getEnvironment() === ENVIRONMENT.PROD;
}

/**
 * Cuts a description to Google Dataset Search's 5000-character maximum.
 * @param description - Description.
 * @returns The description, ending in an ellipsis if it was cut.
 */
function truncateDescription(description: string): string {
  if (description.length <= MAX_DESCRIPTION_LENGTH) return description;
  return `${description.slice(0, MAX_DESCRIPTION_LENGTH - 1)}…`;
}
