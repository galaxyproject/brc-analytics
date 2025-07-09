import {
  BRCDataCatalogGenome,
  Outbreak,
} from "../../../app/apis/catalog/brc-analytics-catalog/common/entities";
import { getGenomeId } from "../../../app/apis/catalog/brc-analytics-catalog/common/utils";
import { Organisms as SourceOrganisms } from "../../schema/generated/schema";
import { SOURCE_GENOME_KEYS } from "./constants";
import { SourceGenome } from "./entities";
import {
  defaultStringToNone,
  parseBoolean,
  parseList,
  parseNumber,
  parseNumberOrNull,
  parseStringOrNull,
  readValuesFile,
  readYamlFile,
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
  const sourceOrganisms = await readYamlFile<SourceOrganisms>(
    SOURCE_PATH_ORGANISMS
  );
  const sourceOrganismsByTaxonomyId = new Map(
    sourceOrganisms.organisms.map((sourceOrganism) => [
      String(sourceOrganism.taxonomy_id),
      sourceOrganism,
    ])
  );
  const mappedRows: BRCDataCatalogGenome[] = [];
  for (const row of sourceRows) {
    const ploidy = sourceOrganismsByTaxonomyId.get(
      row.speciesTaxonomyId
    )?.ploidy;
    if (ploidy === undefined) {
      console.log(
        `Skipping assembly ${row.accession} [tax_id: ${row.speciesTaxonomyId}] - ploidy not found`
      );
      continue;
    }
    const taxonomicLevelStrain =
      row.taxonomicLevelStrain ||
      (row.strain
        ? `${row.taxonomicLevelSpecies} strain ${row.strain}`
        : "None");
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
      otherTaxa: row.otherTaxa ? row.otherTaxa.split(",") : null,
      ploidy,
      priority: outbreak?.priority ?? null,
      priorityPathogenName: outbreak?.name ?? null,
      scaffoldCount: parseNumberOrNull(row.scaffoldCount),
      scaffoldL50: parseNumberOrNull(row.scaffoldL50),
      scaffoldN50: parseNumberOrNull(row.scaffoldN50),
      speciesTaxonomyId: row.speciesTaxonomyId,
      strainName: parseStringOrNull(row.strain),
      taxonomicGroup: row.taxonomicGroup ? row.taxonomicGroup.split(",") : [],
      taxonomicLevelClass: defaultStringToNone(row.taxonomicLevelClass),
      taxonomicLevelDomain: defaultStringToNone(row.taxonomicLevelDomain),
      taxonomicLevelFamily: defaultStringToNone(row.taxonomicLevelFamily),
      taxonomicLevelGenus: defaultStringToNone(row.taxonomicLevelGenus),
      taxonomicLevelKingdom: defaultStringToNone(row.taxonomicLevelKingdom),
      taxonomicLevelOrder: defaultStringToNone(row.taxonomicLevelOrder),
      taxonomicLevelPhylum: defaultStringToNone(row.taxonomicLevelPhylum),
      taxonomicLevelRealm: defaultStringToNone(row.taxonomicLevelRealm),
      taxonomicLevelSpecies: defaultStringToNone(row.taxonomicLevelSpecies),
      taxonomicLevelStrain,
      ucscBrowserUrl: parseStringOrNull(row.ucscBrowser),
    });
  }
  const sortedRows = mappedRows.sort((a, b) =>
    a.accession.localeCompare(b.accession)
  );
  verifyUniqueIds("assembly", sortedRows, getGenomeId);
  return sortedRows;
}

/**
 * Get the outbreak associated with the first of the given lineage taxa that has an assocated outbreak, or null if none is found.
 * @param outbreaksByTaxonomyId - Map from taxonomy ID (number) to outbreak.
 * @param lineageTaxonomyIds - Taxonomic lineage (array of taxonomy ID strings).
 * @returns matching outbreak, or null.
 */
function getOutbreakMatchingLineage(
  outbreaksByTaxonomyId: Map<number, Outbreak>,
  lineageTaxonomyIds: string[]
): Outbreak | null {
  for (const stringId of lineageTaxonomyIds) {
    const outbreak = outbreaksByTaxonomyId.get(Number(stringId));
    if (outbreak !== undefined) return outbreak;
  }
  return null;
}
