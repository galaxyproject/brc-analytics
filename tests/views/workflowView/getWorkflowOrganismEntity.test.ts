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
      getOrganism: (entityId: string): unknown => {
        const organism = ORGANISMS.find(
          (o: { ncbiTaxonomyId: string }) => o.ncbiTaxonomyId === entityId
        );
        if (!organism) throw new Error(`Organism not found: ${entityId}`);
        return organism;
      },
    };
  }
);

import { getWorkflowOrganismEntity } from "@repo/shared/views/WorkflowView/hooks/UseWorkflowEntities/utils";
import {
  CLADE_WORKFLOW,
  IN_CLADE_ORGANISM_A,
  OUT_OF_CLADE_ORGANISM,
  SPECIES_WORKFLOW,
} from "../../workflow/cladeFixtures";

describe("getWorkflowOrganismEntity", () => {
  test("resolves the organism the workflow's taxonomyId names", () => {
    expect(getWorkflowOrganismEntity(SPECIES_WORKFLOW, undefined)).toBe(
      OUT_OF_CLADE_ORGANISM
    );
  });

  test("falls back to the organism picked within a clade", () => {
    expect(
      getWorkflowOrganismEntity(
        CLADE_WORKFLOW,
        IN_CLADE_ORGANISM_A.ncbiTaxonomyId
      )
    ).toBe(IN_CLADE_ORGANISM_A);
  });

  test("resolves no organism for a clade with no pick", () => {
    expect(
      getWorkflowOrganismEntity(CLADE_WORKFLOW, undefined)
    ).toBeUndefined();
  });
});
