import {
  WORKFLOW_PLOIDY,
  WORKFLOW_SCOPE,
} from "@repo/shared/apis/schema-types";
import type { OrganismContract } from "@repo/shared/apis/types";
import type {
  WorkflowAssemblyMapping,
  WorkflowCategory,
} from "@repo/shared/apis/workflow";
import type { WorkflowAssembly } from "@repo/shared/views/WorkflowsView/types";
import { getWorkflows } from "@repo/shared/views/WorkflowsView/utils";
import { buildWorkflowGates } from "../../workflow/gates";

jest.mock("@repo/shared/workflow/differentialExpressionAnalysis", () => ({
  DIFFERENTIAL_EXPRESSION_ANALYSIS: {
    assemblyCountMax: 1,
    assemblyCountMin: 1,
    iwcId: "iwc-deseq2",
    parameters: [],
    ploidy: "ANY",
    scope: "ASSEMBLY",
    taxonomyId: null,
    trsId: "differential-expression-analysis",
    workflowDescription: "DESeq2 workflow",
    workflowName: "Differential Expression Analysis",
  },
}));

describe("getWorkflows - other names projection", () => {
  const MAPPINGS: WorkflowAssemblyMapping[] = [
    { compatibleAssemblyCount: 1, workflowTrsId: "#trs-taxon" },
  ];

  const CATEGORIES: WorkflowCategory[] = [
    {
      category: "Test Category",
      description: "desc",
      name: "Test",
      showComingSoon: false,
      workflows: [
        {
          assemblyCountMax: 1,
          assemblyCountMin: 1,
          iwcId: "iwc-taxon",
          parameters: [],
          ploidy: WORKFLOW_PLOIDY.ANY,
          scope: WORKFLOW_SCOPE.ASSEMBLY,
          taxonomyId: "999",
          trsId: "#trs-taxon",
          workflowDescription: "taxon-scoped workflow",
          workflowName: "Taxon Workflow",
        },
      ],
    },
  ];

  // The genome literal carries the assembly fields getWorkflows reads off it,
  // while `genomes` is typed as the narrower organism projection — the same
  // widening the function itself does internally.
  const organismsWithNames = (otherNames: string[]): OrganismContract[] => {
    const genome: { lineageTaxonomyIds: string[]; otherNames: string[] } = {
      lineageTaxonomyIds: ["999"],
      otherNames,
    };
    return [
      {
        genomes: [genome],
        ncbiTaxonomyId: "999",
        taxonomicLevelSpecies: "Mycobacterium tuberculosis",
      },
    ];
  };

  function taxonWorkflowAssembly(organisms: OrganismContract[]): string[] {
    const workflows = getWorkflows(
      CATEGORIES,
      MAPPINGS,
      organisms,
      buildWorkflowGates()
    );
    const entity = workflows.find((w) => w.trsId === "#trs-taxon");
    expect(entity).toBeDefined();
    // otherNames is present at runtime for every site but only typed on the
    // site-specific extension, so read it through that type.
    return (entity?.assembly as WorkflowAssembly).otherNames;
  }

  test("exposes the matched assembly's other names on the workflow entity", () => {
    // The facet and column on the workflow list read these values straight off
    // the entity, so they must arrive intact and in the catalog's order.
    expect(
      taxonWorkflowAssembly(
        organismsWithNames(["Bacillus tuberculosis", "Bacterium tuberculosis"])
      )
    ).toEqual(["Bacillus tuberculosis", "Bacterium tuberculosis"]);
  });

  test("reads ['None'] when the matched assembly has no other names", () => {
    expect(taxonWorkflowAssembly(organismsWithNames([]))).toEqual(["None"]);
  });

  test("reads ['Any'] when no assembly matches the workflow's taxon", () => {
    expect(taxonWorkflowAssembly([])).toEqual(["Any"]);
  });
});
