// Define types for BRC Analytics data

// Session type for chat history
export interface Session {
  createdAt: number;
  id: string;
  messages: Array<{ content: string; role: string }>;
  updatedAt: number;
}

// Organism type based on organisms.json
export interface Organism {
  assemblyCount: number;
  assemblyTaxonomyIds: string[];
  commonName: string | null;
  genomes: Genome[];
}

// Genome type for organism data
export interface Genome {
  accession: string;
  annotationStatus: string | null;
  chromosomes: Record<string, unknown> | null;
  commonName: string | null;
  coverage: string;
  gcPercent: number;
  geneModelUrl: string;
  isRef: string;
  length: number;
  level: string;
  lineageTaxonomyIds: string[];
  ncbiTaxonomyId: string;
  otherTaxa: Record<string, unknown> | null;
  ploidy: string[];
  priority: Record<string, unknown> | null;
  priorityPathogenName: string | null;
  scaffoldCount: number;
  scaffoldL50: number;
  scaffoldN50: number;
  speciesTaxonomyId: string;
  strainName: string;
  taxonomicGroup: string[];
  taxonomicLevelClass: string;
  taxonomicLevelDomain: string;
  taxonomicLevelFamily: string;
  taxonomicLevelGenus: string;
  taxonomicLevelOrder: string;
  taxonomicLevelPhylum: string;
  taxonomicLevelSpecies: string;
  taxonomicLevelStrain: string;
}

// Assembly type based on assemblies.json
export interface Assembly {
  accession: string;
  annotationStatus: string | null;
  chromosomes: Record<string, unknown> | null;
  commonName: string | null;
  coverage: string;
  gcPercent: number;
  geneModelUrl: string;
  isRef: string;
  length: number;
  level: string;
  lineageTaxonomyIds: string[];
  ncbiTaxonomyId: string;
  otherTaxa: Record<string, unknown> | null;
  ploidy: string[];
  priority: Record<string, unknown> | null;
  priorityPathogenName: string | null;
  scaffoldCount: number;
  scaffoldL50: number;
  scaffoldN50: number;
  speciesTaxonomyId: string;
  strainName: string;
  taxonomicGroup: string[];
  taxonomicLevelClass: string;
  taxonomicLevelDomain: string;
  taxonomicLevelFamily: string;
  taxonomicLevelGenus: string;
  taxonomicLevelOrder: string;
  taxonomicLevelPhylum: string;
  taxonomicLevelSpecies: string;
  taxonomicLevelStrain: string;
}

// Workflow type based on workflows.json
export interface Workflow {
  description: string;
  id: string;
  name: string;
  parameters: WorkflowParameter[];
  steps: WorkflowStep[];
  tags: string[];
  url?: string;
  version: string;
}

export interface WorkflowParameter {
  default?: unknown;
  description?: string;
  id: string;
  name: string;
  required: boolean;
  type: string;
  url_spec?: WorkflowUrlSpec;
  variable?: string;
}

export interface WorkflowUrlSpec {
  headers?: Record<string, string>;
  method: string;
  url: string;
}

export interface WorkflowStep {
  description?: string;
  id: string;
  inputs: Record<string, unknown>;
  name: string;
  outputs: Record<string, unknown>;
  tool_id: string;
}

// Outbreak type based on outbreaks.json
export interface Outbreak {
  description: string;
  id: string;
  name: string;
  priority: string;
  resources: OutbreakResource[];
  taxonomyId: string;
}

export interface OutbreakResource {
  title: string;
  type: string;
  url: string;
}
