import { BRCDataCatalogGenome } from "../../../sites/brc-analytics/apis/assembly";
import { BRCDataCatalogOrganism } from "../../../sites/brc-analytics/apis/organism";
import { getOrganismId } from "../../../sites/brc-analytics/apis/utils";
import {
  accumulateArrayOrNullValues,
  accumulateArrayValue,
  incrementValue,
  parseJsonList,
  readValuesFile,
  verifyUniqueIds,
} from "./utils";

const SOURCE_PATH_ORGANISM_SYNONYMS =
  "catalog/build/intermediate/organism-synonyms.tsv";

/**
 * Row of the organism synonyms file built by the Python catalog build.
 */
interface SourceOrganismSynonyms {
  synonyms: string;
  taxonomy_id: string;
}

export async function buildOrganisms(
  genomes: BRCDataCatalogGenome[]
): Promise<BRCDataCatalogOrganism[]> {
  const synonymsByTaxonomyId = await getSynonymsByTaxonomyId();
  const organismsByTaxonomyId = new Map<string, BRCDataCatalogOrganism>();
  for (const genome of genomes) {
    organismsByTaxonomyId.set(
      genome.speciesTaxonomyId,
      buildOrganism(
        organismsByTaxonomyId.get(genome.speciesTaxonomyId),
        genome,
        synonymsByTaxonomyId.get(genome.speciesTaxonomyId) ?? []
      )
    );
  }
  const sortedRows = Array.from(organismsByTaxonomyId.values()).sort((a, b) =>
    a.ncbiTaxonomyId.localeCompare(b.ncbiTaxonomyId)
  );
  verifyUniqueIds("organism", sortedRows, getOrganismId);
  return sortedRows;
}

/**
 * Read the synonyms built for each of the catalog's organisms, which combine NCBI's
 * synonyms with the curated synonyms from the source organisms file.
 * @returns map from organism taxonomy ID to that organism's synonyms.
 */
async function getSynonymsByTaxonomyId(): Promise<Map<string, string[]>> {
  const sourceRows = await readValuesFile<SourceOrganismSynonyms>(
    SOURCE_PATH_ORGANISM_SYNONYMS,
    undefined,
    ["taxonomy_id", "synonyms"]
  );
  return new Map(
    sourceRows.map((row) => [row.taxonomy_id, parseJsonList(row.synonyms)])
  );
}

function buildOrganism(
  organism: BRCDataCatalogOrganism | undefined,
  genome: BRCDataCatalogGenome,
  synonyms: string[]
): BRCDataCatalogOrganism {
  return {
    assemblyCount: incrementValue(organism?.assemblyCount),
    assemblyTaxonomyIds: accumulateArrayValue(
      organism?.assemblyTaxonomyIds,
      genome.ncbiTaxonomyId
    ),
    commonNames: accumulateArrayValue(
      organism?.commonNames,
      ...genome.commonNames
    ),
    genomes: accumulateArrayValue(organism?.genomes, genome),
    ncbiTaxonomyId: genome.speciesTaxonomyId,
    otherTaxa: accumulateArrayOrNullValues(
      organism?.otherTaxa,
      genome.otherTaxa
    ),
    priority: organism?.priority ?? genome.priority,
    priorityPathogenName:
      organism?.priorityPathogenName ?? genome.priorityPathogenName,
    synonyms,
    taxonomicGroup: genome.taxonomicGroup,
    taxonomicLevelClass: genome.taxonomicLevelClass,
    taxonomicLevelDomain: genome.taxonomicLevelDomain,
    taxonomicLevelFamily: genome.taxonomicLevelFamily,
    taxonomicLevelGenus: genome.taxonomicLevelGenus,
    taxonomicLevelIsolate: accumulateArrayValue(
      organism?.taxonomicLevelIsolate,
      genome.taxonomicLevelIsolate
    ),
    taxonomicLevelKingdom: genome.taxonomicLevelKingdom,
    taxonomicLevelOrder: genome.taxonomicLevelOrder,
    taxonomicLevelPhylum: genome.taxonomicLevelPhylum,
    taxonomicLevelRealm: genome.taxonomicLevelRealm,
    taxonomicLevelSerotype: accumulateArrayValue(
      organism?.taxonomicLevelSerotype,
      genome.taxonomicLevelSerotype
    ),
    taxonomicLevelSpecies: genome.taxonomicLevelSpecies,
    taxonomicLevelStrain: accumulateArrayValue(
      organism?.taxonomicLevelStrain,
      genome.taxonomicLevelStrain
    ),
  };
}
