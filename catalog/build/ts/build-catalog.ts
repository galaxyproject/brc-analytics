import { parse as parseCsv } from "csv-parse/sync";
import fsp from "fs/promises";
import YAML from "yaml";
import {
  BRCDataCatalogGenome,
  BRCDataCatalogOrganism,
  WorkflowCategory,
} from "../../../app/apis/catalog/brc-analytics-catalog/common/entities";
import {
  Organisms as SourceOrganisms,
  Workflow as SourceWorkflow,
  WorkflowCategories as SourceWorkflowCategories,
  Workflows as SourceWorkflows,
} from "../../schema/generated/schema";
import { SourceGenome } from "./entities";

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

  console.log("Genomes:", genomes.length);
  await saveJson("catalog/output/genomes.json", genomes);

  console.log("Organisms:", organisms.length);
  await saveJson("catalog/output/organisms.json", organisms);

  console.log("Workflows:", workflows.length);
  await saveJson("catalog/output/workflows.json", workflows);

  console.log("Done");
}

async function buildGenomes(): Promise<BRCDataCatalogGenome[]> {
  const sourceRows = await readValuesFile<SourceGenome>(SOURCE_PATH_GENOMES);
  const sourceOrganisms = await readYamlFile<SourceOrganisms>(SOURCE_PATH_ORGANISMS);
  const sourceOrganismsByTaxonomyId = new Map(sourceOrganisms.organisms.map((sourceOrganism) => [String(sourceOrganism.taxonomy_id), sourceOrganism]));
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
      ploidy: sourceOrganismsByTaxonomyId.get(row.speciesTaxonomyId)?.ploidy ?? null,
      scaffoldCount: parseNumberOrNull(row.scaffoldCount),
      scaffoldL50: parseNumberOrNull(row.scaffoldL50),
      scaffoldN50: parseNumberOrNull(row.scaffoldN50),
      species: row.species,
      speciesTaxonomyId: row.speciesTaxonomyId,
      strain: parseStringOrNull(row.strain),
      taxonomicGroup: row.taxonomicGroup ? row.taxonomicGroup.split(",") : [],
      ucscBrowserUrl: parseStringOrNull(row.ucscBrowser),
    };
  });
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
    assemblyTaxonomyIds: Array.from(
      new Set([...(organism?.assemblyTaxonomyIds ?? []), genome.ncbiTaxonomyId])
    ),
    genomes: [...(organism?.genomes ?? []), genome],
    ncbiTaxonomyId: genome.speciesTaxonomyId,
    species: genome.species,
    taxonomicGroup: genome.taxonomicGroup,
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
    const workflowCategory = workflowCategories.find((c) => c.category === category);
    if (!workflowCategory) throw new Error(`Unknown workflow category: ${category}`);
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
  delimiter = "\t"
): Promise<T[]> {
  const content = await fsp.readFile(filePath, "utf8");
  return parseCsv(content, {
    columns: true,
    delimiter,
    relax_quotes: true,
  });
}

async function readYamlFile<T>(filePath: string): Promise<T> {
  const content = await fsp.readFile(filePath, "utf8");
  return YAML.parse(content);
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
