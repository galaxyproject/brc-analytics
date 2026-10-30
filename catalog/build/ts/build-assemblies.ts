import { type BRCDataCatalogGenome } from "../../../sites/brc-analytics/apis/assembly";
import { type Outbreak } from "../../../sites/brc-analytics/apis/outbreak";
import { getGenomeId } from "../../../sites/brc-analytics/apis/utils";
import { SOURCE_GENOME_KEYS } from "./constants";
import { type SourceGenome } from "./entities";
import {
  defaultStringToNone,
  getOutbreakMatchingLineage,
  getSpeciesStrainName,
  parseBoolean,
  parseJsonList,
  parseList,
  parseListOrNull,
  parseNumber,
  parseNumberOrNull,
  parsePloidyForAssembly,
  parseStringOrNull,
  readValuesFile,
  verifyUniqueIds,
} from "./utils";

const SOURCE_PATH_GENOMES = "catalog/build/intermediate/genomes-from-ncbi.tsv";

export async function buildAssemblies(
  outbreaksByTaxonomyId: Map<number, Outbreak>
): Promise<BRCDataCatalogGenome[]> {
  const sourceRows = await readValuesFile<SourceGenome>(
    SOURCE_PATH_GENOMES,
    undefined,
    SOURCE_GENOME_KEYS
  );
  const mappedRows: BRCDataCatalogGenome[] = [];
  for (const row of sourceRows) {
    const ploidy = parsePloidyForAssembly(row);
    if (ploidy === null) continue;
    const lineageTaxonomyIds = parseList(row.lineageTaxonomyIds);
    const outbreak = getOutbreakMatchingLineage(
      outbreaksByTaxonomyId,
      lineageTaxonomyIds
    );
    mappedRows.push({
      accession: row.accession,
      annotationStatus: parseStringOrNull(row.annotationStatus),
      chromosomes: parseNumberOrNull(row.chromosomeCount),
      coverage: parseStringOrNull(row.coverage),
      galaxyDatacacheUrl: parseStringOrNull(row.galaxyDatacacheUrl),
      gcPercent: parseNumberOrNull(row.gcPercent),
      geneModelUrl: parseStringOrNull(row.geneModelUrl),
      isRef: parseBoolean(row.isRef),
      length: parseNumber(row.length),
      level: row.level,
      lineageTaxonomyIds,
      ncbiTaxonomyId: row.taxonomyId,
      otherNames: parseJsonList(row.otherNames),
      otherTaxa: parseListOrNull(row.otherTaxa),
      ploidy,
      priority: outbreak?.priority ?? null,
      priorityPathogenName: outbreak?.name ?? null,
      releaseDate: row.releaseDate,
      scaffoldCount: parseNumberOrNull(row.scaffoldCount),
      scaffoldL50: parseNumberOrNull(row.scaffoldL50),
      scaffoldN50: parseNumberOrNull(row.scaffoldN50),
      speciesTaxonomyId: row.speciesTaxonomyId,
      strainName: parseStringOrNull(row.strain),
      taxonomicGroup: parseList(row.taxonomicGroup),
      taxonomicLevelClass: defaultStringToNone(row.taxonomicLevelClass),
      taxonomicLevelDomain: defaultStringToNone(row.taxonomicLevelDomain),
      taxonomicLevelFamily: defaultStringToNone(row.taxonomicLevelFamily),
      taxonomicLevelGenus: defaultStringToNone(row.taxonomicLevelGenus),
      taxonomicLevelIsolate: defaultStringToNone(row.taxonomicLevelIsolate),
      taxonomicLevelKingdom: defaultStringToNone(row.taxonomicLevelKingdom),
      taxonomicLevelOrder: defaultStringToNone(row.taxonomicLevelOrder),
      taxonomicLevelPhylum: defaultStringToNone(row.taxonomicLevelPhylum),
      taxonomicLevelRealm: defaultStringToNone(row.taxonomicLevelRealm),
      taxonomicLevelSerotype: defaultStringToNone(row.taxonomicLevelSerotype),
      taxonomicLevelSpecies: defaultStringToNone(row.taxonomicLevelSpecies),
      taxonomicLevelStrain: getSpeciesStrainName(
        row.taxonomicLevelSpecies,
        row.taxonomicLevelStrain,
        row.strain
      ),
      ucscBrowserUrl: parseStringOrNull(row.ucscBrowser),
    });
  }
  const sortedRows = mappedRows.sort((a, b) =>
    a.accession.localeCompare(b.accession)
  );
  verifyUniqueIds("assembly", sortedRows, getGenomeId);
  return sortedRows;
}
