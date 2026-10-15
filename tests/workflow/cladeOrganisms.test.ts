jest.mock(
  "@repo/shared/services/workflows/entities",
  (): Record<string, unknown> => {
    const { ORGANISMS } = jest.requireActual("./cladeFixtures");
    return {
      findOrganism: (entityId: string): unknown =>
        ORGANISMS.find(
          (o: { ncbiTaxonomyId: string }) => o.ncbiTaxonomyId === entityId
        ),
      getOrganisms: (): unknown => ORGANISMS,
    };
  }
);

import {
  findCladeOrganism,
  getCladeOrganisms,
  hasCladeOrganisms,
} from "@repo/shared/workflow/cladeOrganisms";
import {
  ASSEMBLY_WORKFLOW,
  CLADE_WORKFLOW,
  EMPTY_CLADE_WORKFLOW,
  IN_CLADE_ORGANISM_A,
  IN_CLADE_ORGANISM_B,
  NO_TAXONOMY_WORKFLOW,
  OUT_OF_CLADE_ORGANISM,
  SPECIES_WORKFLOW,
} from "./cladeFixtures";

describe("cladeOrganisms", () => {
  describe("getCladeOrganisms", () => {
    test("lists only organisms whose lineage contains the clade taxon", () => {
      expect(getCladeOrganisms(CLADE_WORKFLOW)).toEqual([
        IN_CLADE_ORGANISM_A,
        IN_CLADE_ORGANISM_B,
      ]);
    });

    test("returns no organisms when the taxonomyId is a catalog organism", () => {
      expect(getCladeOrganisms(SPECIES_WORKFLOW)).toEqual([]);
    });

    test("returns no organisms for an assembly-scoped workflow", () => {
      expect(getCladeOrganisms(ASSEMBLY_WORKFLOW)).toEqual([]);
    });

    test("returns no organisms for a workflow with no taxonomyId", () => {
      expect(getCladeOrganisms(NO_TAXONOMY_WORKFLOW)).toEqual([]);
    });

    test("returns no organisms for a clade with no catalog organisms", () => {
      expect(getCladeOrganisms(EMPTY_CLADE_WORKFLOW)).toEqual([]);
    });
  });

  describe("hasCladeOrganisms", () => {
    test("is true for a clade with catalog organisms", () => {
      expect(hasCladeOrganisms(CLADE_WORKFLOW)).toBe(true);
    });

    test("is false for a clade with no catalog organisms", () => {
      expect(hasCladeOrganisms(EMPTY_CLADE_WORKFLOW)).toBe(false);
    });

    test("is false when the taxonomyId is a catalog organism", () => {
      expect(hasCladeOrganisms(SPECIES_WORKFLOW)).toBe(false);
    });

    test("is false for assembly-scoped and no-taxonomyId workflows", () => {
      expect(hasCladeOrganisms(ASSEMBLY_WORKFLOW)).toBe(false);
      expect(hasCladeOrganisms(NO_TAXONOMY_WORKFLOW)).toBe(false);
    });
  });

  describe("findCladeOrganism", () => {
    test("returns an organism picked within the clade", () => {
      expect(
        findCladeOrganism(CLADE_WORKFLOW, IN_CLADE_ORGANISM_B.ncbiTaxonomyId)
      ).toBe(IN_CLADE_ORGANISM_B);
    });

    test("ignores an organism outside the clade", () => {
      expect(
        findCladeOrganism(CLADE_WORKFLOW, OUT_OF_CLADE_ORGANISM.ncbiTaxonomyId)
      ).toBeUndefined();
    });

    test("ignores an unknown taxonomy ID", () => {
      expect(findCladeOrganism(CLADE_WORKFLOW, "12345")).toBeUndefined();
    });

    test("returns undefined when no organism is picked", () => {
      expect(findCladeOrganism(CLADE_WORKFLOW, undefined)).toBeUndefined();
    });

    test("returns undefined when the workflow is not a clade", () => {
      expect(
        findCladeOrganism(SPECIES_WORKFLOW, IN_CLADE_ORGANISM_A.ncbiTaxonomyId)
      ).toBeUndefined();
    });
  });
});
