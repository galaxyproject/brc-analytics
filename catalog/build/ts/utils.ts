import { parse as parseCsv } from "csv-parse/sync";
import fsp from "fs/promises";
import YAML from "yaml";

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

export function accumulateArrayValue<T>(array: T[] | undefined, value: T): T[] {
  if (!array) return [value];
  if (array.includes(value)) return array;
  return [...array, value];
}

export function defaultStringToNone(value: string): string {
  return value || "None";
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

export function parseBoolean(value: string): string {
  return value[0].toLowerCase() === "t" ? "Yes" : "No";
}
