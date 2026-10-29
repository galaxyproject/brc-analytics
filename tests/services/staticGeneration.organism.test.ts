import { WORKFLOW_PARAMETER_VARIABLE } from "@repo/shared/apis/schema-types";
import type { OrganismContract } from "@repo/shared/apis/types";
import type { WorkflowCategory } from "@repo/shared/apis/workflow";
import { slimOrganismGenomes } from "@repo/shared/services/staticGeneration/organism/utils";

describe("slimOrganismGenomes", () => {
  test("cuts each genome down to its lineage taxonomy IDs", () => {
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

    expect(slimOrganismGenomes(organism, [])).toEqual({
      genomes: [
        { lineageTaxonomyIds: ["1", "5833"] },
        { lineageTaxonomyIds: ["1", "5834"] },
      ],
      ncbiTaxonomyId: "5833",
      taxonomicLevelSpecies: "Plasmodium falciparum",
    });
  });

  test("keeps the organism's other fields", () => {
    const organism = {
      genomes: [],
      ncbiTaxonomyId: "5833",
      priorityPathogenName: "Malaria",
      taxonomicLevelSpecies: "Plasmodium falciparum",
    } as OrganismContract;

    expect(slimOrganismGenomes(organism, [])).toEqual(organism);
  });

  test("returns an organism with no genomes unchanged, without adding the field", () => {
    // Static props must be JSON-serializable, so an undefined field can't be
    // introduced.
    const organism: OrganismContract = {
      ncbiTaxonomyId: "5833",
      taxonomicLevelSpecies: "Plasmodium falciparum",
    };

    const slim = slimOrganismGenomes(organism, []);

    expect(slim).toBe(organism);
    expect("genomes" in slim).toBe(false);
  });

  test("keeps the genomes in full when a compatible workflow takes an assembly collection", () => {
    const organism = {
      genomes: [
        { accession: "GCF_000864005.1", lineageTaxonomyIds: ["1", "10239"] },
      ],
      ncbiTaxonomyId: "3431196",
      taxonomicLevelSpecies: "Norovirus norwalkense",
    } as unknown as OrganismContract;
    const organismWorkflowCategories = [
      {
        workflows: [
          {
            parameters: [
              {
                key: "Unaligned sequences",
                variable: WORKFLOW_PARAMETER_VARIABLE.FASTA_COLLECTION,
              },
            ],
          },
        ],
      },
    ] as unknown as WorkflowCategory[];

    expect(slimOrganismGenomes(organism, organismWorkflowCategories)).toBe(
      organism
    );
  });

  test("keeps the genomes in full when a compatible workflow takes a reference assembly", () => {
    const organism = {
      genomes: [
        { accession: "GCF_000864005.1", lineageTaxonomyIds: ["1", "10239"] },
      ],
      ncbiTaxonomyId: "3431196",
      taxonomicLevelSpecies: "Norovirus norwalkense",
    } as unknown as OrganismContract;
    const organismWorkflowCategories = [
      {
        workflows: [
          {
            parameters: [
              {
                key: "reference Fasta",
                variable: WORKFLOW_PARAMETER_VARIABLE.ASSEMBLY_FASTA_URL,
              },
            ],
          },
        ],
      },
    ] as unknown as WorkflowCategory[];

    expect(slimOrganismGenomes(organism, organismWorkflowCategories)).toBe(
      organism
    );
  });
});
