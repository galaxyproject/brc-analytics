import {
  ORGANISM_PLOIDY,
  WORKFLOW_CATEGORY_ID,
} from "@repo/shared/apis/schema-types";
import type { AssemblyContract } from "@repo/shared/apis/types";
import {
  isAssemblyWorkflowAvailable,
  isListedWorkflowAvailable,
} from "@repo/shared/components/workflow/WorkflowGate/utils";
import { setEntitiesById } from "@repo/shared/services/workflows/store";
import { getWorkflows } from "@repo/shared/views/WorkflowsView/utils";
import { buildAssemblyWorkflows } from "@repo/shared/workflow/assemblyWorkflows";
import { DIFFERENTIAL_EXPRESSION_ANALYSIS } from "@repo/shared/workflow/differentialExpressionAnalysis";
import {
  buildWorkflowCategory,
  buildWorkflowGates,
  seedWorkflowsStore,
  UNGATED_TRS_ID,
} from "./gates";

// List Differential Expression Analysis under a demo-gated category, so the
// test can check that every path gates it as a member of that category.
jest.mock("@repo/shared/workflow/differentialExpressionAnalysis", () => ({
  ...jest.requireActual<object>(
    "@repo/shared/workflow/differentialExpressionAnalysis"
  ),
  DIFFERENTIAL_EXPRESSION_ANALYSIS_CATEGORY: "ASSEMBLY",
}));

const ASSEMBLY_ID = "GCF_000000001_1";
const ASSEMBLY = {
  galaxyDatacacheUrl: null,
  lineageTaxonomyIds: ["1"],
  ploidy: [ORGANISM_PLOIDY.DIPLOID],
} as unknown as AssemblyContract;
const CATEGORIES = [
  buildWorkflowCategory(WORKFLOW_CATEGORY_ID.ASSEMBLY, [UNGATED_TRS_ID]),
];
const DEA_TRS_ID = DIFFERENTIAL_EXPRESSION_ANALYSIS.trsId;

/**
 * Determines whether a list of workflows includes Differential Expression
 * Analysis.
 * @param trsIds - TRS IDs of the listed workflows.
 * @returns True when the list includes it.
 */
function includesDea(trsIds: string[]): boolean {
  return trsIds.includes(DEA_TRS_ID);
}

describe("Differential Expression Analysis under a gated category", () => {
  beforeEach(() => {
    seedWorkflowsStore(CATEGORIES, [DIFFERENTIAL_EXPRESSION_ANALYSIS]);
    setEntitiesById("assemblies", new Map([[ASSEMBLY_ID, ASSEMBLY]]));
  });

  it("is dropped from the workflows list, the assembly's list, its configure page and its detail page with the demo flag off", () => {
    const gates = buildWorkflowGates();
    expect(
      includesDea(getWorkflows(CATEGORIES, [], [], gates).map((w) => w.trsId))
    ).toBe(false);
    expect(
      includesDea(
        buildAssemblyWorkflows(ASSEMBLY, CATEGORIES, gates).flatMap(
          ({ workflows }) => workflows.map((w) => w.trsId)
        )
      )
    ).toBe(false);
    expect(isAssemblyWorkflowAvailable(DEA_TRS_ID, gates, ASSEMBLY_ID)).toBe(
      false
    );
    expect(isListedWorkflowAvailable(DEA_TRS_ID, gates)).toBe(false);
  });

  it("is shown on every path with the demo flag on", () => {
    const gates = buildWorkflowGates(true);
    expect(
      includesDea(getWorkflows(CATEGORIES, [], [], gates).map((w) => w.trsId))
    ).toBe(true);
    expect(
      includesDea(
        buildAssemblyWorkflows(ASSEMBLY, CATEGORIES, gates).flatMap(
          ({ workflows }) => workflows.map((w) => w.trsId)
        )
      )
    ).toBe(true);
    expect(isAssemblyWorkflowAvailable(DEA_TRS_ID, gates, ASSEMBLY_ID)).toBe(
      true
    );
    expect(isListedWorkflowAvailable(DEA_TRS_ID, gates)).toBe(true);
  });
});
