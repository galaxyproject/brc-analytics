import { WORKFLOW_PARAMETER_VARIABLE } from "@repo/shared/apis/schema-types";
import type { OrganismContract } from "@repo/shared/apis/types";
import type { Workflow } from "@repo/shared/apis/workflow";
import {
  canSelectOrganism,
  getOrganismSelectionValidation,
} from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/OrganismStep/components/OrganismData/components/OrganismSelector/hooks/UseTable/utils";

const FASTA_COLLECTION_WORKFLOW = {
  assemblyCountMax: null,
  assemblyCountMin: 2,
  parameters: [
    {
      key: "Unaligned sequences",
      variable: WORKFLOW_PARAMETER_VARIABLE.FASTA_COLLECTION,
    },
  ],
} as unknown as Workflow;

const READ_RUN_WORKFLOW = {
  ...FASTA_COLLECTION_WORKFLOW,
  parameters: [
    {
      key: "Paired reads",
      variable: WORKFLOW_PARAMETER_VARIABLE.SANGER_READ_RUN_PAIRED,
    },
  ],
} as Workflow;

/**
 * Returns an organism with the given assembly count.
 * @param assemblyCount - Assembly count.
 * @returns Organism.
 */
function makeOrganism(assemblyCount?: number): OrganismContract {
  return {
    assemblyCount,
    ncbiTaxonomyId: "3431196",
    taxonomicLevelSpecies: "Norovirus norwalkense",
  };
}

describe("canSelectOrganism", () => {
  test("allows an organism with at least the workflow's minimum assemblies", () => {
    expect(canSelectOrganism(makeOrganism(2), FASTA_COLLECTION_WORKFLOW)).toBe(
      true
    );
    expect(canSelectOrganism(makeOrganism(20), FASTA_COLLECTION_WORKFLOW)).toBe(
      true
    );
  });

  test("blocks an organism with fewer than the workflow's minimum assemblies", () => {
    expect(canSelectOrganism(makeOrganism(1), FASTA_COLLECTION_WORKFLOW)).toBe(
      false
    );
    expect(
      canSelectOrganism(makeOrganism(undefined), FASTA_COLLECTION_WORKFLOW)
    ).toBe(false);
  });

  test("allows any organism for a workflow that takes no assembly collection", () => {
    expect(canSelectOrganism(makeOrganism(1), READ_RUN_WORKFLOW)).toBe(true);
  });
});

describe("getOrganismSelectionValidation", () => {
  test("returns undefined for an organism that can be picked", () => {
    expect(
      getOrganismSelectionValidation(makeOrganism(2), FASTA_COLLECTION_WORKFLOW)
    ).toBeUndefined();
  });

  test("explains the minimum for an organism with too few assemblies", () => {
    expect(
      getOrganismSelectionValidation(makeOrganism(1), FASTA_COLLECTION_WORKFLOW)
    ).toBe("This workflow needs at least 2 assemblies; this organism has 1.");
  });
});
