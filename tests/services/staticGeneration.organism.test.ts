import type { OrganismContract } from "@repo/shared/apis/types";
import { slimOrganismGenomes } from "@repo/shared/services/staticGeneration/organism/utils";

describe("slimOrganismGenomes", () => {
  test("cuts each genome down to its lineage taxonomy IDs", async () => {
    // A full genome record carries far more than the contract's lineage IDs.
    const organism = {
      genomes: [
        {
          accession: "GCF_000002765.6",
          lineageTaxonomyIds: ["1", "5833"],
          ucscBrowserUrl: "https://genome.ucsc.edu",
        },
        { accession: "GCA_000001.1", lineageTaxonomyIds: ["1", "5834"] },
      ],
      ncbiTaxonomyId: "5833",
      taxonomicLevelSpecies: "Plasmodium falciparum",
    } as unknown as OrganismContract;

    await expect(slimOrganismGenomes(organism)).resolves.toEqual({
      genomes: [
        { lineageTaxonomyIds: ["1", "5833"] },
        { lineageTaxonomyIds: ["1", "5834"] },
      ],
      ncbiTaxonomyId: "5833",
      taxonomicLevelSpecies: "Plasmodium falciparum",
    });
  });

  test("keeps the organism's other fields", async () => {
    const organism = {
      genomes: [],
      ncbiTaxonomyId: "5833",
      priorityPathogenName: "Malaria",
      taxonomicLevelSpecies: "Plasmodium falciparum",
    } as OrganismContract;

    await expect(slimOrganismGenomes(organism)).resolves.toEqual(organism);
  });

  test("returns an organism with no genomes unchanged, without adding the field", async () => {
    // Static props must be JSON-serializable, so an undefined field can't be
    // introduced.
    const organism: OrganismContract = {
      ncbiTaxonomyId: "5833",
      taxonomicLevelSpecies: "Plasmodium falciparum",
    };

    const slim = await slimOrganismGenomes(organism);

    expect(slim).toBe(organism);
    expect("genomes" in slim).toBe(false);
  });
});
