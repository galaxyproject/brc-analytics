import { parse as parseCsv } from "csv-parse/sync";
import fsp from "fs/promises";
import { MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import YAML from "yaml";
import {
  OrganismPloidy,
  Organism as SourceOrganism,
  Organisms as SourceOrganisms,
} from "../../schema/generated/schema";
import { Outbreak } from "../../../app/apis/catalog/brc-analytics-catalog/common/entities";

export async function getSourceOrganismsByTaxonomyId(
  sourceOrganismsPath: string
): Promise<Map<string, SourceOrganism>> {
  const sourceOrganisms =
    await readYamlFile<SourceOrganisms>(sourceOrganismsPath);
  return new Map(
    sourceOrganisms.organisms.map((sourceOrganism) => [
      String(sourceOrganism.taxonomy_id),
      sourceOrganism,
    ])
  );
}

/**
 * Get the ploidy for an assembly, logging a message if the assembly will be skipped.
 * @param sourceOrganismsByTaxonomyId - Source organisms mapped by species taxonomy ID, to get ploidy from.
 * @param speciesTaxonomyId - Species taxonomy ID of the assembly.
 * @param willSkipIfNull - Whether the assembly will be skipped if the returned ploidy is null.
 * @param assemblyAccession - Assembly accession to reference in the log message.
 * @returns array of ploidy values, or null if organism info was not found.
 */
export function getPloidyForAssembly(
  sourceOrganismsByTaxonomyId: Map<string, SourceOrganism>,
  speciesTaxonomyId: string,
  willSkipIfNull: boolean = false,
  assemblyAccession?: string
): OrganismPloidy[] | null {
  const ploidy =
    sourceOrganismsByTaxonomyId.get(speciesTaxonomyId)?.ploidy ?? null;
  if (willSkipIfNull && ploidy === null) {
    console.log(
      `Skipping assembly${assemblyAccession ? " " + assemblyAccession : ""} [tax_id: ${speciesTaxonomyId}] - ploidy not found`
    );
  }
  return ploidy;
}

export function getSpeciesStrainName(
  sourceTaxonomicLevelSpecies: string,
  sourceTaxonomicLevelStrain: string,
  sourceStrain: string
): string {
  return (
    sourceTaxonomicLevelStrain ||
    (sourceStrain
      ? `${sourceTaxonomicLevelSpecies} strain ${sourceStrain}`
      : "None")
  );
}

/**
 * Get the outbreak associated with the first of the given lineage taxa that has an assocated outbreak, or null if none is found.
 * @param outbreaksByTaxonomyId - Map from taxonomy ID (number) to outbreak.
 * @param lineageTaxonomyIds - Taxonomic lineage (array of taxonomy ID strings).
 * @returns matching outbreak, or null.
 */
export function getOutbreakMatchingLineage(
  outbreaksByTaxonomyId: Map<number, Outbreak>,
  lineageTaxonomyIds: string[]
): Outbreak | null {
  for (const stringId of lineageTaxonomyIds) {
    const outbreak = outbreaksByTaxonomyId.get(Number(stringId));
    if (outbreak !== undefined) return outbreak;
  }
  return null;
}

export async function readValuesFile<T>(
  filePath: string,
  delimiter = "\t",
  checkKeys?: readonly string[]
): Promise<T[]> {
  const content = await fsp.readFile(filePath, "utf8");
  const result = parseCsv(content, {
    columns: true,
    delimiter,
    relax_quotes: true,
  });
  if (checkKeys && result[0]) {
    for (const key of checkKeys) {
      if (!Object.hasOwn(result[0], key))
        throw new Error(`Missing column ${JSON.stringify(key)} in ${filePath}`);
    }
  }
  return result;
}

export async function readYamlFile<T>(filePath: string): Promise<T> {
  const content = await fsp.readFile(filePath, "utf8");
  return YAML.parse(content);
}

export async function readMdxFile(
  filePath: string
): Promise<MDXRemoteSerializeResult> {
  return await serialize(await fsp.readFile(filePath));
}

export async function saveJson(filePath: string, data: unknown): Promise<void> {
  await fsp.writeFile(filePath, JSON.stringify(data, undefined, 2) + "\n");
}

/**
 * Take a list of entities and check for duplicate IDs, as calculated by the given function, and throw an error if there are any.
 * @param entityName - Name of the entity type, to use in the error message.
 * @param entities - Array of entities.
 * @param getId - Function to get an entity's ID.
 */
export function verifyUniqueIds<T>(
  entityName: string,
  entities: T[],
  getId: (entity: T) => string
): void {
  const idCounts = new Map<string, number>();
  for (const entity of entities) {
    const id = getId(entity);
    idCounts.set(id, (idCounts.get(id) ?? 0) + 1);
  }
  const duplicateIdEntries = Array.from(idCounts.entries()).filter(
    ([, count]) => count > 1
  );
  if (duplicateIdEntries.length > 0) {
    const duplicateIds = duplicateIdEntries.map(([id]) => id);
    throw new Error(
      `Duplicate ${entityName} IDs found: ${duplicateIds.join(", ")}`
    );
  }
}

/**
 * Get maximum number among two possibly-absent values, or null if both are null or undefined.
 * @param a - First value.
 * @param b - Second value.
 * @returns maximum number, or null.
 */
export function getMaxDefined(
  a: number | null | undefined,
  b: number | null | undefined
): number | null {
  if (typeof a === "number") {
    if (typeof b === "number") return Math.max(a, b);
    else return a;
  } else {
    return b ?? null;
  }
}

export function incrementValue(value?: number): number {
  return (value ?? 0) + 1;
}

export function accumulateArrayOrNullValues<T>(
  array: T[] | null | undefined,
  values: T[] | null
): T[] | null {
  return values
    ? accumulateArrayValue(array ?? undefined, ...values)
    : (array ?? null);
}

export function accumulateArrayValue<T>(
  array: T[] | undefined,
  ...values: T[]
): T[] {
  if (!array) return [...values];
  const result = [...array];
  for (const value of values) {
    if (!result.includes(value)) {
      result.push(value);
    }
  }
  return result;
}

export function defaultStringToNone(value: string): string {
  return value || "None";
}

export function parseListOrNull(value: string): string[] | null {
  return value ? value.split(",") : null;
}

export function parseList(value: string): string[] {
  return value ? value.split(",") : [];
}

export function parseStringOrNull(value: string): string | null {
  return value || null;
}

export function parseNumberOrNull(value: string): number | null {
  if (!value) return null;
  return parseNumber(value);
}

export function parseNumber(value: string): number {
  value = value.trim();
  const n = Number(value);
  if (!value || isNaN(n))
    throw new Error(`Invalid number value: ${JSON.stringify(value)}`);
  return n;
}

export function parseBoolean(value: string): "Yes" | "No" {
  return value[0].toLowerCase() === "t" ? "Yes" : "No";
}
