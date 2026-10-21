// Mock step modules to avoid pulling in unneeded UI step modules.
jest.mock(
  "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/OrganismStep/step",
  (): Record<string, unknown> => ({
    STEP: { key: "organism", label: "Organism" },
  })
);
jest.mock(
  "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/steps/constants",
  (): Record<string, unknown> => ({
    SEQUENCING_STEPS: {
      readRunPairedFile: {},
      readRunSingleFile: {},
      readRunsPaired: {},
      readRunsSingle: {},
    },
  })
);
jest.mock(
  "@repo/shared/services/workflows/entities",
  (): Record<string, unknown> => {
    const { ORGANISMS } = jest.requireActual("../../workflow/cladeFixtures");
    return {
      findOrganism: (entityId: string): unknown =>
        ORGANISMS.find(
          (o: { ncbiTaxonomyId: string }) => o.ncbiTaxonomyId === entityId
        ),
      getOrganisms: (): unknown => ORGANISMS,
    };
  }
);

import { type StepConfig } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/types";
import { insertOrganismStep } from "@repo/shared/views/WorkflowView/steps/utils";
import {
  ASSEMBLY_WORKFLOW,
  CLADE_WORKFLOW,
  EMPTY_CLADE_WORKFLOW,
  NO_TAXONOMY_WORKFLOW,
  SPECIES_WORKFLOW,
} from "../../workflow/cladeFixtures";

const SEQUENCING_STEP = { key: "readRunsPaired" } as StepConfig;
const REFERENCE_ASSEMBLY_STEP = { key: "referenceAssembly" } as StepConfig;

/**
 * Returns the keys of the given steps.
 * @param steps - Steps.
 * @returns Step keys.
 */
function getKeys(steps: StepConfig[]): string[] {
  return steps.map((step) => step.key);
}

describe("insertOrganismStep", () => {
  test("inserts the Organism step first for a clade workflow with a read-run step", () => {
    expect(
      getKeys(insertOrganismStep([SEQUENCING_STEP], CLADE_WORKFLOW))
    ).toEqual(["organism", "readRunsPaired"]);
  });

  test("leaves the steps unchanged for a clade workflow with no read-run step", () => {
    const steps: StepConfig[] = [];
    expect(insertOrganismStep(steps, CLADE_WORKFLOW)).toBe(steps);
  });

  test("leaves the steps unchanged for a clade with no catalog organisms", () => {
    const steps = [SEQUENCING_STEP];
    expect(insertOrganismStep(steps, EMPTY_CLADE_WORKFLOW)).toBe(steps);
  });

  test("leaves the steps unchanged when the taxonomyId is a catalog organism", () => {
    const steps = [SEQUENCING_STEP];
    expect(insertOrganismStep(steps, SPECIES_WORKFLOW)).toBe(steps);
  });

  test("leaves the steps unchanged for an assembly-scoped workflow", () => {
    const steps = [REFERENCE_ASSEMBLY_STEP, SEQUENCING_STEP];
    expect(insertOrganismStep(steps, ASSEMBLY_WORKFLOW)).toBe(steps);
  });

  test("leaves the steps unchanged for a workflow with no taxonomyId", () => {
    const steps = [SEQUENCING_STEP];
    expect(insertOrganismStep(steps, NO_TAXONOMY_WORKFLOW)).toBe(steps);
  });
});
