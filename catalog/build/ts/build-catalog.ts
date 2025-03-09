import { parse as parseCsv } from "csv-parse/sync";
import fsp from "fs/promises";
import YAML from "yaml";
import {
  BRCDataCatalogGenome,
  BRCDataCatalogOrganism,
  WorkflowCategory,
} from "../../../app/apis/catalog/brc-analytics-catalog/common/entities";
import {
  getGenomeId,
  getOrganismId,
} from "../../../app/apis/catalog/brc-analytics-catalog/common/utils";
import {
  Organisms as SourceOrganisms,
  Workflow as SourceWorkflow,
  WorkflowCategories as SourceWorkflowCategories,
  Workflows as SourceWorkflows,
} from "../../schema/generated/schema";
import { SourceGenome } from "./entities";
import { SOURCE_GENOME_KEYS } from "./constants";

const SOURCE_PATH_GENOMES = "catalog/build/intermediate/genomes-from-ncbi.tsv";
const SOURCE_PATH_ORGANISMS = "catalog/source/organisms.yml";
const SOURCE_PATH_WORKFLOW_CATEGORIES =
  "catalog/source/workflow_categories.yml";
const SOURCE_PATH_WORKFLOWS = "catalog/source/workflows.yml";

buildCatalog();

async function buildCatalog(): Promise<void> {
  const genomes = await buildGenomes();
  const organisms = buildOrganisms(genomes);
  const workflows = await buildWorkflows();

  verifyUniqueIds("assembly", genomes, getGenomeId);
  verifyUniqueIds("organism", organisms, getOrganismId);

  console.log("Assemblies:", genomes.length);
  await saveJson("catalog/output/assemblies.json", genomes);

  console.log("Organisms:", organisms.length);
  await saveJson("catalog/output/organisms.json", organisms);

  console.log("Workflows:", workflows.length);
  await saveJson("catalog/output/workflows.json", workflows);

  console.log("Done");
}

async function buildGenomes(): Promise<BRCDataCatalogGenome[]> {
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
    mappedRows.push({
      accession: row.accession,
      annotationStatus: parseStringOrNull(row.annotationStatus),
      chromosomes: parseNumberOrNull(row.chromosomeCount),
      coverage: parseStringOrNull(row.coverage),
      gcPercent: parseNumberOrNull(row.gcPercent),
      geneModelUrl: parseStringOrNull(row.geneModelUrl),
      isRef: parseBoolean(row.isRef),
      length: parseNumber(row.length),
      level: row.level,
      ncbiTaxonomyId: row.taxonomyId,
      ploidy,
      scaffoldCount: parseNumberOrNull(row.scaffoldCount),
      scaffoldL50: parseNumberOrNull(row.scaffoldL50),
      scaffoldN50: parseNumberOrNull(row.scaffoldN50),
      speciesTaxonomyId: row.speciesTaxonomyId,
      strainName: parseStringOrNull(row.strain),
      taxonomicGroup: row.taxonomicGroup ? row.taxonomicGroup.split(",") : [],
      taxonomicLevelClass: defaultStringToNone(row.taxonomicLevelClass),
      taxonomicLevelFamily: defaultStringToNone(row.taxonomicLevelFamily),
      taxonomicLevelGenus: defaultStringToNone(row.taxonomicLevelGenus),
      taxonomicLevelKingdom: defaultStringToNone(row.taxonomicLevelKingdom),
      taxonomicLevelOrder: defaultStringToNone(row.taxonomicLevelOrder),
      taxonomicLevelPhylum: defaultStringToNone(row.taxonomicLevelPhylum),
      taxonomicLevelSpecies: defaultStringToNone(row.taxonomicLevelSpecies),
      taxonomicLevelStrain,
      taxonomicLevelSuperkingdom: defaultStringToNone(
        row.taxonomicLevelSuperkingdom
      ),
      ucscBrowserUrl: parseStringOrNull(row.ucscBrowser),
    });
  }
  return mappedRows.sort((a, b) => a.accession.localeCompare(b.accession));
}

function buildOrganisms(
  genomes: BRCDataCatalogGenome[]
): BRCDataCatalogOrganism[] {
  const organismsByTaxonomyId = new Map<string, BRCDataCatalogOrganism>();
  for (const genome of genomes) {
    organismsByTaxonomyId.set(
      genome.speciesTaxonomyId,
      buildOrganism(organismsByTaxonomyId.get(genome.speciesTaxonomyId), genome)
    );
  }
  return Array.from(organismsByTaxonomyId.values()).sort((a, b) =>
    a.ncbiTaxonomyId.localeCompare(b.ncbiTaxonomyId)
  );
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
    genomes: accumulateArrayValue(organism?.genomes, genome),
    ncbiTaxonomyId: genome.speciesTaxonomyId,
    taxonomicGroup: genome.taxonomicGroup,
    taxonomicLevelClass: genome.taxonomicLevelClass,
    taxonomicLevelFamily: genome.taxonomicLevelFamily,
    taxonomicLevelGenus: genome.taxonomicLevelGenus,
    taxonomicLevelKingdom: genome.taxonomicLevelKingdom,
    taxonomicLevelOrder: genome.taxonomicLevelOrder,
    taxonomicLevelPhylum: genome.taxonomicLevelPhylum,
    taxonomicLevelSpecies: genome.taxonomicLevelSpecies,
    taxonomicLevelStrain: accumulateArrayValue(
      organism?.taxonomicLevelStrain,
      genome.taxonomicLevelStrain
    ),
    taxonomicLevelSuperkingdom: genome.taxonomicLevelSuperkingdom,
  };
}

async function buildWorkflows(): Promise<WorkflowCategory[]> {
  const sourceWorkflowCategories = await readYamlFile<SourceWorkflowCategories>(
    SOURCE_PATH_WORKFLOW_CATEGORIES
  );
  const sourceWorkflows = await readYamlFile<SourceWorkflows>(
    SOURCE_PATH_WORKFLOWS
  );

  const workflowCategories: WorkflowCategory[] =
    sourceWorkflowCategories.workflow_categories.map(
      ({ category, description, name }) => ({
        category,
        description,
        name,
        workflows: [],
      })
    );

  for (const sourceWorkflow of sourceWorkflows.workflows) {
    buildWorkflow(workflowCategories, sourceWorkflow);
  }

  return workflowCategories;
}

function buildWorkflow(
  workflowCategories: WorkflowCategory[],
  {
    categories,
    ploidy,
    trs_id: trsId,
    workflow_description: workflowDescription,
    workflow_name: workflowName,
  }: SourceWorkflow
): void {
  for (const category of categories) {
    const workflowCategory = workflowCategories.find(
      (c) => c.category === category
    );
    if (!workflowCategory)
      throw new Error(`Unknown workflow category: ${category}`);
    workflowCategory.workflows.push({
      ploidy,
      trsId,
      workflowDescription,
      workflowName,
    });
  }
}

async function readValuesFile<T>(
  filePath: string,
  delimiter = "\t",
  checkKeys?: readonly string[]
): Promise<T[]> {
  const content = await fsp.readFile(filePath, "utf8");
  const result = parseCsv(content, {
    columns: true,
    delimiter,
    relax_quotes: true,
  });
  if (checkKeys && result[0]) {
    for (const key of checkKeys) {
      if (!Object.hasOwn(result[0], key))
        throw new Error(`Missing column ${JSON.stringify(key)} in ${filePath}`);
    }
  }
  return result;
}

async function readYamlFile<T>(filePath: string): Promise<T> {
  const content = await fsp.readFile(filePath, "utf8");
  return YAML.parse(content);
}

async function saveJson(filePath: string, data: unknown): Promise<void> {
  await fsp.writeFile(filePath, JSON.stringify(data, undefined, 2) + "\n");
}

/**
 * Take a list of entities and check for duplicate IDs, as calculated by the given function, and throw an error if there are any.
 * @param entityName - Name of the entity type, to use in the error message.
 * @param entities - Array of entities.
 * @param getId - Function to get an entity's ID.
 */
function verifyUniqueIds<T>(
  entityName: string,
  entities: T[],
  getId: (entity: T) => string
): void {
  const idCounts = new Map<string, number>();
  for (const entity of entities) {
    const id = getId(entity);
    idCounts.set(id, (idCounts.get(id) ?? 0) + 1);
  }
  const duplicateIdEntries = Array.from(idCounts.entries()).filter(
    ([, count]) => count > 1
  );
  if (duplicateIdEntries.length > 0) {
    const duplicateIds = duplicateIdEntries.map(([id]) => id);
    throw new Error(
      `Duplicate ${entityName} IDs found: ${duplicateIds.join(", ")}`
    );
  }
}

function accumulateArrayValue<T>(array: T[] | undefined, value: T): T[] {
  if (!array) return [value];
  if (array.includes(value)) return array;
  return [...array, value];
}

function defaultStringToNone(value: string): string {
  return value || "None";
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
