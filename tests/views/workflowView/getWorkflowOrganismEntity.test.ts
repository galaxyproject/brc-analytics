jest.mock(
  "@repo/shared/services/workflows/entities",
  (): Record<string, unknown> => {
    const { ORGANISMS } = jest.requireActual("../../workflow/cladeFixtures");
    return {
      findOrganism: (entityId: string): unknown =>
        ORGANISMS.find(
          (o: { ncbiTaxonomyId: string }) => o.ncbiTaxonomyId === entityId
        ),
      getAssembly: jest.fn(),
      getOrganisms: (): unknown => ORGANISMS,
    };
  }
);

import { getWorkflowOrganismEntity } from "@repo/shared/views/WorkflowView/hooks/UseWorkflowEntities/utils";
import {
  ASSEMBLY_WORKFLOW,
  CLADE_WORKFLOW,
  IN_CLADE_ORGANISM_A,
  OUT_OF_CLADE_ORGANISM,
  SPECIES_WORKFLOW,
} from "../../workflow/cladeFixtures";

describe("getWorkflowOrganismEntity", () => {
  test("resolves the organism the workflow's taxonomyId names, ignoring any pick", () => {
    expect(
      getWorkflowOrganismEntity(
        SPECIES_WORKFLOW,
        IN_CLADE_ORGANISM_A.ncbiTaxonomyId
      )
    ).toBe(OUT_OF_CLADE_ORGANISM);
  });

  test("falls back to the organism picked within a clade", () => {
    expect(
      getWorkflowOrganismEntity(
        CLADE_WORKFLOW,
        IN_CLADE_ORGANISM_A.ncbiTaxonomyId
      )
    ).toBe(IN_CLADE_ORGANISM_A);
  });

  test("ignores a picked organism outside the clade", () => {
    expect(
      getWorkflowOrganismEntity(
        CLADE_WORKFLOW,
        OUT_OF_CLADE_ORGANISM.ncbiTaxonomyId
      )
    ).toBeUndefined();
  });

  test("resolves no organism for a clade with no pick", () => {
    expect(
      getWorkflowOrganismEntity(CLADE_WORKFLOW, undefined)
    ).toBeUndefined();
  });

  test("resolves no organism for an assembly-scoped workflow", () => {
    expect(
      getWorkflowOrganismEntity(
        ASSEMBLY_WORKFLOW,
        IN_CLADE_ORGANISM_A.ncbiTaxonomyId
      )
    ).toBeUndefined();
  });
});
