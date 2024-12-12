import { parse as parseCsv } from "csv-parse/sync";
import fsp from "fs/promises";
import {
  BRCDataCatalogGenome,
  BRCDataCatalogOrganism,
} from "../app/apis/catalog/brc-analytics-catalog/common/entities";
import { SourceGenome, SourceOrganism } from "./entities";

const SOURCE_PATH_ORGANISMS = "files/source/organisms-from-ncbi.tsv";
const SOURCE_PATH_GENOMES = "files/source/genomes-from-ncbi.tsv";

buildCatalog();

async function buildCatalog(): Promise<void> {
  const organisms = await buildOrganisms();

  const organismsByTaxon = new Map(
    organisms.map((organism) => [organism.taxon, organism])
  );

  const genomes = await buildGenomes(organismsByTaxon);

  console.log("Organisms:", genomes.length);
  await saveJson("files/out/organisms.json", organisms);

  console.log("Genomes:", genomes.length);
  await saveJson("files/out/genomes.json", genomes);

  console.log("Done");
}

async function buildOrganisms(): Promise<BRCDataCatalogOrganism[]> {
  const sourceRows = await readValuesFile<SourceOrganism>(
    SOURCE_PATH_ORGANISMS
  );
  const mappedRows = sourceRows.map((row): BRCDataCatalogOrganism => {
    return {
      assemblyCount: parseNumber(row.assemblyCount),
      ncbiTaxonomyId: row.taxonomyId,
      tags: row.CustomTags ? [row.CustomTags] : [],
      taxon: row.taxon,
    };
  });
  return mappedRows.sort((a, b) =>
    a.ncbiTaxonomyId.localeCompare(b.ncbiTaxonomyId)
  );
}

async function buildGenomes(
  organismsByTaxon: Map<string, BRCDataCatalogOrganism>
): Promise<BRCDataCatalogGenome[]> {
  const sourceRows = await readValuesFile<SourceGenome>(SOURCE_PATH_GENOMES);
  const mappedRows = sourceRows.map((row): BRCDataCatalogGenome => {
    return {
      accession: row.accession,
      annotationStatus: parseStringOrNull(row.annotationStatus),
      chromosomes: parseNumberOrNull(row.chromosomeCount),
      coverage: parseStringOrNull(row.coverage),
      gcPercent: parseNumber(row.gcPercent),
      geneModelUrl: parseStringOrNull(row.geneModelUrl),
      isRef: parseBoolean(row.isRef),
      length: parseNumber(row.length),
      level: row.level,
      ncbiTaxonomyId: row.taxonomyId,
      scaffoldCount: parseNumber(row.scaffoldCount),
      scaffoldL50: parseNumber(row.scaffoldL50),
      scaffoldN50: parseNumber(row.scaffoldN50),
      strain: parseStringOrNull(row.strain),
      tags: organismsByTaxon.get(row.taxon)?.tags ?? [],
      taxon: row.taxon,
      ucscBrowserUrl: parseStringOrNull(row.ucscBrowser),
    };
  });
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

function parseBoolean(value: string): string {
  return value[0].toLowerCase() === "t" ? "Yes" : "No";
}
