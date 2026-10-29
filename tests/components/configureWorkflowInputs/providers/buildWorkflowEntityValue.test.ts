import type { OrganismContract } from "@repo/shared/apis/types";
import { buildWorkflowEntityValue } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/providers/WorkflowEntity/utils";

const ASSEMBLY = {
  accession: "GCF_000864005.1",
  lineageTaxonomyIds: ["1", "10239"],
};

describe("buildWorkflowEntityValue", () => {
  test("returns null when there is no source", () => {
    expect(buildWorkflowEntityValue(undefined)).toBeNull();
  });

  test("lists an organism's genomes that are full assembly records", () => {
    const organism = {
      genomes: [ASSEMBLY],
      ncbiTaxonomyId: "3431196",
      taxonomicLevelSpecies: "Norovirus norwalkense",
    } as unknown as OrganismContract;

    expect(buildWorkflowEntityValue(organism)).toEqual({
      assemblies: [ASSEMBLY],
      ncbiTaxonomyId: "3431196",
      taxonomicLevelSpecies: "Norovirus norwalkense",
    });
  });

  test("leaves out genomes cut down to their lineage taxonomy IDs", () => {
    const organism: OrganismContract = {
      genomes: [{ lineageTaxonomyIds: ["1", "10239"] }],
      ncbiTaxonomyId: "3431196",
      taxonomicLevelSpecies: "Norovirus norwalkense",
    };

    expect(buildWorkflowEntityValue(organism)?.assemblies).toEqual([]);
  });

  test("lists no assemblies for a source without genomes", () => {
    expect(
      buildWorkflowEntityValue({
        ncbiTaxonomyId: "5833",
        taxonomicLevelSpecies: "Plasmodium falciparum",
      })?.assemblies
    ).toEqual([]);
  });
});
