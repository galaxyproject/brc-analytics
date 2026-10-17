import {
  WORKFLOW_PARAMETER_VARIABLE,
  WORKFLOW_PLOIDY,
  WORKFLOW_SCOPE,
} from "@repo/shared/apis/schema-types";
import type { OrganismContract } from "@repo/shared/apis/types";
import type { Workflow } from "@repo/shared/apis/workflow";

/**
 * Fixture clade taxon (Bacteria) — a node above species, not itself a catalog organism.
 */
export const CLADE_TAXONOMY_ID = "2";

/**
 * Fixture catalog organisms: two within the clade and one outside it.
 */
export const IN_CLADE_ORGANISM_A: OrganismContract = {
  genomes: [{ lineageTaxonomyIds: ["1", CLADE_TAXONOMY_ID, "100"] }],
  ncbiTaxonomyId: "100",
  taxonomicLevelSpecies: "Bacterium alpha",
};

export const IN_CLADE_ORGANISM_B: OrganismContract = {
  genomes: [{ lineageTaxonomyIds: ["1", CLADE_TAXONOMY_ID, "200"] }],
  ncbiTaxonomyId: "200",
  taxonomicLevelSpecies: "Bacterium beta",
};

export const OUT_OF_CLADE_ORGANISM: OrganismContract = {
  genomes: [{ lineageTaxonomyIds: ["1", "10239", "300"] }],
  ncbiTaxonomyId: "300",
  taxonomicLevelSpecies: "Virus gamma",
};

export const ORGANISMS: OrganismContract[] = [
  IN_CLADE_ORGANISM_A,
  IN_CLADE_ORGANISM_B,
  OUT_OF_CLADE_ORGANISM,
];

const BASE_WORKFLOW: Workflow = {
  assemblyCountMax: 0,
  assemblyCountMin: 0,
  iwcId: "iwc-test",
  parameters: [
    {
      key: "Paired reads",
      variable: WORKFLOW_PARAMETER_VARIABLE.SANGER_READ_RUN_PAIRED,
    },
  ],
  ploidy: WORKFLOW_PLOIDY.ANY,
  scope: WORKFLOW_SCOPE.ORGANISM,
  taxonomyId: null,
  trsId: "#trs-test",
  workflowDescription: "test workflow",
  workflowName: "Test Workflow",
};

/**
 * Organism-scoped workflow whose taxonomyId is a clade with catalog organisms.
 */
export const CLADE_WORKFLOW: Workflow = {
  ...BASE_WORKFLOW,
  taxonomyId: CLADE_TAXONOMY_ID,
};

/**
 * Organism-scoped workflow whose taxonomyId is a clade with no catalog organisms.
 */
export const EMPTY_CLADE_WORKFLOW: Workflow = {
  ...BASE_WORKFLOW,
  taxonomyId: "999",
};

/**
 * Organism-scoped workflow whose taxonomyId is itself a catalog organism.
 */
export const SPECIES_WORKFLOW: Workflow = {
  ...BASE_WORKFLOW,
  taxonomyId: OUT_OF_CLADE_ORGANISM.ncbiTaxonomyId,
};

/**
 * Assembly-scoped workflow with a clade taxonomyId.
 */
export const ASSEMBLY_WORKFLOW: Workflow = {
  ...BASE_WORKFLOW,
  scope: WORKFLOW_SCOPE.ASSEMBLY,
  taxonomyId: CLADE_TAXONOMY_ID,
};

/**
 * Organism-scoped workflow with no taxonomyId.
 */
export const NO_TAXONOMY_WORKFLOW: Workflow = BASE_WORKFLOW;
