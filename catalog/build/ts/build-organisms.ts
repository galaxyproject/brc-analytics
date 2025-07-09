import {
  BRCDataCatalogGenome,
  BRCDataCatalogOrganism,
} from "../../../app/apis/catalog/brc-analytics-catalog/common/entities";
import { getOrganismId } from "../../../app/apis/catalog/brc-analytics-catalog/common/utils";
import { accumulateArrayValue, verifyUniqueIds } from "./utils";

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
    assemblyCount: (organism?.assemblyCount ?? 0) + 1,
    assemblyTaxonomyIds: accumulateArrayValue(
      organism?.assemblyTaxonomyIds,
      genome.ncbiTaxonomyId
    ),
    commonName: genome.commonName,
    genomes: accumulateArrayValue(organism?.genomes, genome),
    ncbiTaxonomyId: genome.speciesTaxonomyId,
    otherTaxa: genome.otherTaxa
      ? accumulateArrayValue(organism?.otherTaxa || [], ...genome.otherTaxa)
      : organism?.otherTaxa || null,
    priority: organism?.priority ?? genome.priority,
    priorityPathogenName:
      organism?.priorityPathogenName ?? genome.priorityPathogenName,
    taxonomicGroup: genome.taxonomicGroup,
    taxonomicLevelClass: genome.taxonomicLevelClass,
    taxonomicLevelDomain: genome.taxonomicLevelDomain,
    taxonomicLevelFamily: genome.taxonomicLevelFamily,
    taxonomicLevelGenus: genome.taxonomicLevelGenus,
    taxonomicLevelKingdom: genome.taxonomicLevelKingdom,
    taxonomicLevelOrder: genome.taxonomicLevelOrder,
    taxonomicLevelPhylum: genome.taxonomicLevelPhylum,
    taxonomicLevelRealm: genome.taxonomicLevelRealm,
    taxonomicLevelSpecies: genome.taxonomicLevelSpecies,
    taxonomicLevelStrain: accumulateArrayValue(
      organism?.taxonomicLevelStrain,
      genome.taxonomicLevelStrain
    ),
  };
}
