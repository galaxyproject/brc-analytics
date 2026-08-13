import { BRCDataCatalogGenome } from "../../../sites/brc-analytics/apis/assembly";
import { BRCDataCatalogOrganism } from "../../../sites/brc-analytics/apis/organism";
import { getOrganismId } from "../../../sites/brc-analytics/apis/utils";
import {
  accumulateArrayOrNullValues,
  accumulateArrayValue,
  incrementValue,
  verifyUniqueIds,
} from "./utils";

export function buildOrganisms(
  genomes: BRCDataCatalogGenome[]
): BRCDataCatalogOrganism[] {
  const organismsByTaxonomyId = new Map<string, BRCDataCatalogOrganism>();
  for (const genome of genomes) {
    organismsByTaxonomyId.set(
      genome.speciesTaxonomyId,
      buildOrganism(organismsByTaxonomyId.get(genome.speciesTaxonomyId), genome)
    );
  }
  const sortedRows = Array.from(organismsByTaxonomyId.values()).sort((a, b) =>
    a.ncbiTaxonomyId.localeCompare(b.ncbiTaxonomyId)
  );
  verifyUniqueIds("organism", sortedRows, getOrganismId);
  return sortedRows;
}

function buildOrganism(
  organism: BRCDataCatalogOrganism | undefined,
  genome: BRCDataCatalogGenome
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
