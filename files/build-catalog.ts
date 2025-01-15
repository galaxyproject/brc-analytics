import { parse as parseCsv } from "csv-parse/sync";
import fsp from "fs/promises";
import { BRCDataCatalogGenome } from "../app/apis/catalog/brc-analytics-catalog/common/entities";
import { SourceGenome } from "./entities";

const SOURCE_PATH_GENOMES = "files/source/genomes.tsv";

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
      chromosomes: parseNumber(row.Chromosomes),
      contigs: parseNumber(row.Contigs),
      geneModelUrl: row.geneModelUrl,
      genomeVersionAssemblyId: row["Genome Version/Assembly ID"],
      ncbiTaxonomyId: row.taxId,
      organism: row.Organism,
      species: row.Species,
      strain: row.Strain,
      supercontigs: parseNumber(row.Supercontigs),
      ucscBrowserUrl: row.ucscBrowser,
      vEuPathDbProject: row["VEuPathDB Project"],
    })
  );
  return mappedRows.sort((a, b) =>
    a.genomeVersionAssemblyId.localeCompare(b.genomeVersionAssemblyId)
  );
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

function parseNumber(value: string): number {
  value = value.trim();
  const n = Number(value);
  if (!value || isNaN(n))
    throw new Error(`Invalid number value: ${JSON.stringify(value)}`);
  return n;
}
