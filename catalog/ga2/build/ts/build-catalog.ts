import {
  getAssemblyId,
  getOrganismId,
} from "../../../../app/apis/catalog/ga2/utils";
import {
  GA2AssemblyEntity,
  GA2OrganismEntity,
  SRAData,
} from "../../../../app/apis/catalog/ga2/entities";
import {
  defaultStringToNone,
  getMaxDefined,
  getPloidyForAssembly,
  getSourceOrganismsByTaxonomyId,
  getSpeciesStrainName,
  incrementValue,
  parseBoolean,
  parseList,
  parseNumber,
  parseNumberOrNull,
  parseStringOrNull,
  readValuesFile,
  saveJson,
  verifyUniqueIds,
} from "../../../build/ts/utils";
import { SOURCE_GENOME_KEYS, SOURCE_RAWDATA_KEYS } from "./constants";
import { SourceGenome, SourceRawData } from "./entities";

const SOURCE_PATH_ORGANISMS = "catalog/ga2/source/organisms.yml";

const SOURCE_PATH_GENOMES =
  "catalog/ga2/build/intermediate/genomes-from-ncbi.tsv";

const SOURCE_PATH_RAWDATA =
  "catalog/ga2/build/intermediate/primary-data-ncbi.tsv";

buildCatalog();

async function buildCatalog(): Promise<void> {
  const sraData = await buildSraData();
  const genomes = await buildAssemblies(sraData);
  const organisms = buildOrganisms(genomes);

  console.log("Assemblies:", genomes.length);
  await saveJson("catalog/ga2/output/assemblies.json", genomes);

  console.log("Organisms:", organisms.length);
  await saveJson("catalog/ga2/output/organisms.json", organisms);

  console.log("Done");
}

async function buildSraData(): Promise<SRAData[]> {
  const rawddataRows = await readValuesFile<SourceRawData>(
    SOURCE_PATH_RAWDATA,
    undefined,
    SOURCE_RAWDATA_KEYS
  );
  return rawddataRows.map(
    (row): SRAData => ({
      accession: row.accession,
      biosample: row.biosample,
      instrument: row.instrument,
      library_layout: row.library_layout,
      library_source: row.library_source,
      library_strategy: row.library_strategy,
      platform: row.platform,
      run_total_bases: parseNumberOrNull(row.run_total_bases),
      sra_run_acc: row.sra_run_acc,
      sra_sample_acc: row.sra_sample_acc,
      sra_study_acc: row.sra_study_acc,
      total_bases: parseNumberOrNull(row.total_bases),
    })
  );
}

async function buildAssemblies(
  sraData: SRAData[]
): Promise<GA2AssemblyEntity[]> {
  const sourceRows = await readValuesFile<SourceGenome>(
    SOURCE_PATH_GENOMES,
    undefined,
    SOURCE_GENOME_KEYS
  );
  const sourceOrganismsByTaxonomyId = await getSourceOrganismsByTaxonomyId(
    SOURCE_PATH_ORGANISMS
  );

  const mappedRows: GA2AssemblyEntity[] = [];
  for (const row of sourceRows) {
    const ploidy = getPloidyForAssembly(
      sourceOrganismsByTaxonomyId,
      row.speciesTaxonomyId,
      true,
      row.accession
    );
    if (ploidy === null) continue;
    const tolIds = parseList(row.tolId);
    if (tolIds.length > 1)
      console.log(
        `Warning: Multiple ToLIDs found for ${row.accession} (${tolIds.join(", ")})`
      );
    mappedRows.push({
      accession: row.accession,
      annotationStatus: parseStringOrNull(row.annotationStatus),
      chromosomes: parseNumberOrNull(row.chromosomeCount),
      coverage: parseStringOrNull(row.coverage),
      gcPercent: parseNumberOrNull(row.gcPercent),
      geneModelUrl: parseStringOrNull(row.geneModelUrl),
      imageCredit: row.organismImageCredit,
      imageLicense: row.organismImageLicense,
      imageSourceName: row.organismImageSourceName,
      imageSourceUrl: row.organismImageSourceUrl,
      imageUrl: row.organismImageUrl.replace("public/", "/"),
      isRef: parseBoolean(row.isRef),
      length: parseNumber(row.length),
      level: row.level,
      lineageTaxonomyIds: parseList(row.lineageTaxonomyIds),
      ncbiTaxonomyId: row.taxonomyId,
      ploidy,
      scaffoldCount: parseNumberOrNull(row.scaffoldCount),
      scaffoldL50: parseNumberOrNull(row.scaffoldL50),
      scaffoldN50: parseNumberOrNull(row.scaffoldN50),
      speciesTaxonomyId: row.speciesTaxonomyId,
      sra_data: sraData.filter((rawRow) => rawRow.accession === row.accession),
      strainName: parseStringOrNull(row.strain),
      taxonomicGroup: parseList(row.taxonomicGroup),
      taxonomicLevelClass: defaultStringToNone(row.taxonomicLevelClass),
      taxonomicLevelDomain: defaultStringToNone(row.taxonomicLevelDomain),
      taxonomicLevelFamily: defaultStringToNone(row.taxonomicLevelFamily),
      taxonomicLevelGenus: defaultStringToNone(row.taxonomicLevelGenus),
      taxonomicLevelKingdom: defaultStringToNone(row.taxonomicLevelKingdom),
      taxonomicLevelOrder: defaultStringToNone(row.taxonomicLevelOrder),
      taxonomicLevelPhylum: defaultStringToNone(row.taxonomicLevelPhylum),
      taxonomicLevelSpecies: defaultStringToNone(row.taxonomicLevelSpecies),
      taxonomicLevelStrain: getSpeciesStrainName(
        row.taxonomicLevelSpecies,
        row.taxonomicLevelStrain,
        row.strain
      ),
      thumbnailUrl: row.organismThumbnailUrl.replace("public/", "/"),
      tolId: tolIds[0] ?? null,
      ucscBrowserUrl: parseStringOrNull(row.ucscBrowser),
    });
  }

  const sortedRows = mappedRows.sort((a, b) =>
    a.accession.localeCompare(b.accession)
  );
  verifyUniqueIds("assembly", sortedRows, getAssemblyId);
  return sortedRows;
}

function buildOrganisms(genomes: GA2AssemblyEntity[]): GA2OrganismEntity[] {
  const organismsByTaxonomyId = new Map<string, GA2OrganismEntity>();
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
  organism: GA2OrganismEntity | undefined,
  genome: GA2AssemblyEntity
): GA2OrganismEntity {
  return {
    assemblyCount: incrementValue(organism?.assemblyCount),
    assemblyTaxonomyIds: Array.from(
      new Set([...(organism?.assemblyTaxonomyIds ?? []), genome.ncbiTaxonomyId])
    ),
    genomes: [...(organism?.genomes ?? []), genome],
    imageCredit: genome.imageCredit,
    imageLicense: genome.imageLicense,
    imageSourceName: genome.imageSourceName,
    imageSourceUrl: genome.imageSourceUrl,
    imageUrl: genome.imageUrl,
    maxScaffoldN50: getMaxDefined(organism?.maxScaffoldN50, genome.scaffoldN50),
    ncbiTaxonomyId: genome.speciesTaxonomyId,
    taxonomicGroup: genome.taxonomicGroup,
    taxonomicLevelClass: defaultStringToNone(genome.taxonomicLevelClass),
    taxonomicLevelDomain: defaultStringToNone(genome.taxonomicLevelDomain),
    taxonomicLevelFamily: defaultStringToNone(genome.taxonomicLevelFamily),
    taxonomicLevelGenus: defaultStringToNone(genome.taxonomicLevelGenus),
    taxonomicLevelKingdom: defaultStringToNone(genome.taxonomicLevelKingdom),
    taxonomicLevelOrder: defaultStringToNone(genome.taxonomicLevelOrder),
    taxonomicLevelPhylum: defaultStringToNone(genome.taxonomicLevelPhylum),
    taxonomicLevelSpecies: genome.taxonomicLevelSpecies,
    thumbnailUrl: genome.thumbnailUrl,
    tolId: genome.tolId,
  };
}
