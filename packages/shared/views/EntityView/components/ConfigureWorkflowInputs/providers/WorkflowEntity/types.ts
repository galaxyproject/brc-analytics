import type {
  AssemblyContract,
  OrganismContract,
} from "@repo/shared/apis/types";

export interface WorkflowEntityContextValue {
  assemblies: AssemblyContract[];
  ncbiTaxonomyId: string;
  taxonomicLevelSpecies: string;
}

export type WorkflowEntitySource = Pick<
  OrganismContract,
  "genomes" | "ncbiTaxonomyId" | "taxonomicLevelSpecies"
>;
