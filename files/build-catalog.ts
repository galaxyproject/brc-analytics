import { parse as parseCsv } from "csv-parse/sync";
import fsp from "fs/promises";
import { BRCDataCatalogGenome } from "../app/apis/catalog/brc-analytics-catalog/common/entities";
import { SourceGenome } from "./entities";

const SOURCE_PATH_GENOMES = "files/source/genomes-from-ncbi.tsv";

buildCatalog();

async function buildCatalog(): Promise<void> {
  const genomes = await buildGenomes();

  console.log("Genomes:", genomes.length);
  await saveJson("files/out/genomes.json", genomes);

  console.log("Done");
}

async function buildGenomes(): Promise<BRCDataCatalogGenome[]> {
  const sourceRows = await readValuesFile<SourceGenome>(SOURCE_PATH_GENOMES);
  const mappedRows = sourceRows.map(
    (row): BRCDataCatalogGenome => ({
      accession: row.accession,
      annotationStatus: parseStringOrNull(row.annotationStatus),
      chromosomes: parseNumberOrNull(row.chromosomeCount),
      coverage: parseStringOrNull(row.coverage),
      gcPercent: parseNumber(row.gcPercent),
      isRef: parseBoolean(row.isRef),
      length: parseNumber(row.length),
      level: row.level,
      ncbiTaxonomyId: row.taxonomyId,
      organism: row.taxon,
      scaffoldCount: parseNumber(row.scaffoldCount),
      scaffoldL50: parseNumber(row.scaffoldL50),
      scaffoldN50: parseNumber(row.scaffoldN50),
      ucscBrowserUrl: parseStringOrNull(row.ucscBrowser),
    })
  );
  return mappedRows.sort((a, b) => a.accession.localeCompare(b.accession));
}

async function readValuesFile<T>(
  filePath: string,
  delimiter = "\t"
): Promise<T[]> {
  const content = await fsp.readFile(filePath, "utf8");
  return parseCsv(content, {
    columns: true,
    delimiter,
    relax_quotes: true,
  });
}

async function saveJson(filePath: string, data: unknown): Promise<void> {
  await fsp.writeFile(filePath, JSON.stringify(data, undefined, 2) + "\n");
}

function parseStringOrNull(value: string): string | null {
  return value || null;
}

function parseNumberOrNull(value: string): number | null {
  if (!value) return null;
  return parseNumber(value);
}

function parseNumber(value: string): number {
  value = value.trim();
  const n = Number(value);
  if (!value || isNaN(n))
    throw new Error(`Invalid number value: ${JSON.stringify(value)}`);
  return n;
}

function parseBoolean(value: string): boolean {
  return value[0].toLowerCase() === "t";
}
