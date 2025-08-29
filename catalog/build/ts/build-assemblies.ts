import {
  BRCDataCatalogGenome,
  Outbreak,
} from "../../../app/apis/catalog/brc-analytics-catalog/common/entities";
import { getGenomeId } from "../../../app/apis/catalog/brc-analytics-catalog/common/utils";
import { SOURCE_GENOME_KEYS } from "./constants";
import { SourceGenome } from "./entities";
import {
  defaultStringToNone,
  getOutbreakMatchingLineage,
  getPloidyForAssembly,
  getSourceOrganismsByTaxonomyId,
  getSpeciesStrainName,
  parseBoolean,
  parseList,
  parseListOrNull,
  parseNumber,
  parseNumberOrNull,
  parseStringOrNull,
  readValuesFile,
  verifyUniqueIds,
} from "./utils";

const SOURCE_PATH_GENOMES = "catalog/build/intermediate/genomes-from-ncbi.tsv";
const SOURCE_PATH_ORGANISMS = "catalog/source/organisms.yml";

export async function buildAssemblies(
  outbreaksByTaxonomyId: Map<number, Outbreak>
): Promise<BRCDataCatalogGenome[]> {
  const sourceRows = await readValuesFile<SourceGenome>(
    SOURCE_PATH_GENOMES,
    undefined,
    SOURCE_GENOME_KEYS
  );
  const sourceOrganismsByTaxonomyId = await getSourceOrganismsByTaxonomyId(
    SOURCE_PATH_ORGANISMS
  );
  const mappedRows: BRCDataCatalogGenome[] = [];
  for (const row of sourceRows) {
    const ploidy = getPloidyForAssembly(
      sourceOrganismsByTaxonomyId,
      row.speciesTaxonomyId,
      true,
      row.accession
    );
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
      commonName: parseStringOrNull(row.commonName),
      coverage: parseStringOrNull(row.coverage),
      gcPercent: parseNumberOrNull(row.gcPercent),
      geneModelUrl: parseStringOrNull(row.geneModelUrl),
      isRef: parseBoolean(row.isRef),
      length: parseNumber(row.length),
      level: row.level,
      lineageTaxonomyIds,
      ncbiTaxonomyId: row.taxonomyId,
      otherTaxa: parseListOrNull(row.otherTaxa),
      ploidy,
      priority: outbreak?.priority ?? null,
      priorityPathogenName: outbreak?.name ?? null,
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
