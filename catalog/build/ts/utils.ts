import { ORGANISM_PLOIDY } from "@repo/shared/apis/schema-types";
import { parse as parseCsv } from "csv-parse/sync";
import fsp from "fs/promises";
import { type MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import YAML from "yaml";
import { type Outbreak } from "../../../sites/brc-analytics/apis/outbreak";

const ORGANISM_PLOIDIES = Object.values(ORGANISM_PLOIDY);

/**
 * Get the ploidy for an assembly, logging a message and returning null if the value is invalid and the assembly should be skipped.
 * @param assemblyRow - Source row from the genomes TSV.
 * @param assemblyRow.accession - Assembly accession.
 * @param assemblyRow.ploidy - String-encoded assembly ploidies.
 * @param assemblyRow.speciesTaxonomyId - Assembly's species taxonomy ID.
 * @returns array of ploidy values, or null if the ploidies are missing or include an invalid value.
 */
export function parsePloidyForAssembly(assemblyRow: {
  accession: string;
  ploidy: string;
  speciesTaxonomyId: string;
}): ORGANISM_PLOIDY[] | null {
  const unverifiedPloidies = parseJsonListOrNull(assemblyRow.ploidy);
  if (unverifiedPloidies === null) {
    console.log(
      `Skipping assembly ${assemblyRow.accession} [tax_id: ${assemblyRow.speciesTaxonomyId}] - ploidy not found`
    );
    return null;
  }
  const ploidies: ORGANISM_PLOIDY[] = [];
  for (const ploidy of unverifiedPloidies) {
    if (!isPloidy(ploidy)) {
      console.log(
        `Skipping assembly ${assemblyRow.accession} [tax_id: ${assemblyRow.speciesTaxonomyId}] - found unknown ploidy value ${ploidy}`
      );
      return null;
    }
    ploidies.push(ploidy);
  }
  return ploidies;
}

function isPloidy(value: string): value is ORGANISM_PLOIDY {
  return ORGANISM_PLOIDIES.includes(value as ORGANISM_PLOIDY);
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

// Note: next-mdx-remote's serialize unconditionally overrides `mdxOptions.development`
// with `process.env.NODE_ENV !== 'production'`, ignoring any user-provided value.
// To ensure MDX is compiled with the production JSX runtime (jsx instead of jsxDEV),
// the build-brc-db script must be run with NODE_ENV=production.
// See: https://github.com/hashicorp/next-mdx-remote/issues/495
// Source: https://github.com/hashicorp/next-mdx-remote/blob/main/src/serialize.ts#L43
export async function readMdxFile(
  filePath: string
): Promise<MDXRemoteSerializeResult> {
  return await serialize(await fsp.readFile(filePath));
}

export async function readJsonFile<T>(filePath: string): Promise<T> {
  const content = await fsp.readFile(filePath, "utf8");
  return JSON.parse(content);
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

export function parseJsonListOrNull(value: string): string[] | null {
  if (!value) return null;
  return parseJsonList(value);
}

export function parseJsonList(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) throw new Error("JSON value is not an array");
    if (!parsed.every((item) => typeof item === "string"))
      throw new Error("JSON array contains non-string value");
    return parsed;
  } catch (e) {
    throw new Error(
      `Invalid JSON string list: ${JSON.stringify(value)} (${e})`
    );
  }
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
