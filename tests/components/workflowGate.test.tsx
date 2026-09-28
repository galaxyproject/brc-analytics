import {
  ORGANISM_PLOIDY,
  WORKFLOW_CATEGORY_ID,
  WORKFLOW_PARAMETER_VARIABLE,
  WORKFLOW_SCOPE,
} from "@repo/shared/apis/schema-types";
import type {
  AssemblyContract,
  OrganismContract,
} from "@repo/shared/apis/types";
import type { WorkflowAvailability } from "@repo/shared/components/workflow/WorkflowGate/types";
import {
  isAssemblyWorkflowAvailable,
  isOrganismWorkflowAvailable,
} from "@repo/shared/components/workflow/WorkflowGate/utils";
import { WorkflowGate } from "@repo/shared/components/workflow/WorkflowGate/workflowGate";
import { indexWorkflowsById } from "@repo/shared/services/workflows/loader";
import {
  getEntitiesById,
  getEntitiesByType,
  setEntitiesById,
} from "@repo/shared/services/workflows/store";
import { DIFFERENTIAL_EXPRESSION_ANALYSIS } from "@repo/shared/workflow/differentialExpressionAnalysis";
import { LOGAN_SEARCH } from "@repo/shared/workflow/loganSearch";
import { formatTrsId } from "@repo/shared/workflow/utils";
import { cleanup, render, screen } from "@testing-library/react";
import {
  buildWorkflow,
  buildWorkflowCategory,
  HYPHY_TRS_ID,
  seedWorkflowsStore,
  UNGATED_TRS_ID,
} from "../workflow/gates";

const mockUseFeatureFlag = jest.fn<boolean, []>(() => false);

jest.mock(
  "@databiosphere/findable-ui/lib/hooks/useFeatureFlag/useFeatureFlag",
  () => ({ useFeatureFlag: (): boolean => mockUseFeatureFlag() })
);

const ASSEMBLY_ID = "GCF_000000001_1";
const CACHED_ASSEMBLY_ID = "GCF_000000002_1";
const ORGANISM_ID = "999";
const TAXONOMY_ID = "999";

const ASSEMBLY_TRS_ID =
  "#workflow/github.com/iwc-workflows/polish-with-long-reads/main/versions/v0.1";
const NEEDS_DATACACHE_TRS_ID =
  "#workflow/github.com/iwc-workflows/needs-datacache/main";
const OFF_TAXON_ORGANISM_TRS_ID =
  "#workflow/github.com/iwc-workflows/influenza-isolates-consensus-and-subtyping/main";
const OFF_TAXON_TRS_ID = "#workflow/github.com/iwc-workflows/off-taxon/main";
const ORGANISM_TRS_ID =
  "#workflow/github.com/iwc-workflows/assembly-with-flye/main/versions/v0.4";
const SHARED_TRS_ID =
  "#workflow/github.com/iwc-workflows/shared-across-categories/main";

/**
 * Builds an assembly stub with the fields the entity-fit check reads.
 * @param galaxyDatacacheUrl - Galaxy datacache URL, or null when none.
 * @returns Assembly.
 */
function buildAssembly(galaxyDatacacheUrl: string | null): AssemblyContract {
  return {
    galaxyDatacacheUrl,
    lineageTaxonomyIds: ["1", TAXONOMY_ID],
    ploidy: [ORGANISM_PLOIDY.DIPLOID],
  } as AssemblyContract;
}

/**
 * Renders the gate for the given URL TRS ID.
 * @param trsId - Workflow TRS ID, as it appears in the URL.
 * @param isWorkflowAvailable - The page's availability check.
 * @param entityId - ID of the entity the page configures a workflow for.
 */
function renderGate(
  trsId: string,
  isWorkflowAvailable: WorkflowAvailability = isAssemblyWorkflowAvailable,
  entityId = ASSEMBLY_ID
): void {
  render(
    <WorkflowGate
      entityId={entityId}
      fallback={<div>not found</div>}
      isWorkflowAvailable={isWorkflowAvailable}
      trsId={trsId}
    >
      <div>content</div>
    </WorkflowGate>
  );
}

/**
 * Renders the gate as the organism configure page does.
 * @param trsId - Workflow TRS ID, as it appears in the URL.
 */
function renderOrganismGate(trsId: string): void {
  renderGate(trsId, isOrganismWorkflowAvailable, ORGANISM_ID);
}

/**
 * Asserts the gate rendered its children.
 */
function expectContent(): void {
  expect(screen.getByText("content")).toBeTruthy();
  expect(screen.queryByText("not found")).toBeNull();
}

/**
 * Asserts the gate rendered its fallback.
 */
function expectFallback(): void {
  expect(screen.getByText("not found")).toBeTruthy();
  expect(screen.queryByText("content")).toBeNull();
}

describe("WorkflowGate", () => {
  beforeEach(() => {
    mockUseFeatureFlag.mockReturnValue(false);
    seedWorkflowsStore(
      [
        buildWorkflowCategory(WORKFLOW_CATEGORY_ID.OTHER, [
          UNGATED_TRS_ID,
          HYPHY_TRS_ID,
          SHARED_TRS_ID,
        ]),
        buildWorkflowCategory(WORKFLOW_CATEGORY_ID.ASSEMBLY, [
          ASSEMBLY_TRS_ID,
          SHARED_TRS_ID,
        ]),
        buildWorkflowCategory(WORKFLOW_CATEGORY_ID.VARIANT_CALLING, [
          buildWorkflow(OFF_TAXON_TRS_ID, { taxonomyId: "11320" }),
          buildWorkflow(NEEDS_DATACACHE_TRS_ID, {
            parameters: [
              {
                key: "Reference genome",
                variable: WORKFLOW_PARAMETER_VARIABLE.ASSEMBLY_ID,
              },
            ],
          }),
        ]),
        buildWorkflowCategory(WORKFLOW_CATEGORY_ID.TRANSCRIPTOMICS),
        buildWorkflowCategory(
          WORKFLOW_CATEGORY_ID.CONSENSUS_SEQUENCES,
          [
            ORGANISM_TRS_ID,
            buildWorkflow(OFF_TAXON_ORGANISM_TRS_ID, {
              scope: WORKFLOW_SCOPE.ORGANISM,
              taxonomyId: "11320",
            }),
          ],
          WORKFLOW_SCOPE.ORGANISM
        ),
      ],
      [DIFFERENTIAL_EXPRESSION_ANALYSIS, LOGAN_SEARCH]
    );
    setEntitiesById(
      "assemblies",
      new Map([
        [ASSEMBLY_ID, buildAssembly(null)],
        [CACHED_ASSEMBLY_ID, buildAssembly("https://datacache.example")],
      ])
    );
    setEntitiesById(
      "organisms",
      new Map<string, OrganismContract>([
        [
          ORGANISM_ID,
          {
            genomes: [{ lineageTaxonomyIds: ["1", TAXONOMY_ID] }],
          } as OrganismContract,
        ],
      ])
    );
  });

  describe("on the assembly configure page", () => {
    test("renders children for a workflow the assembly's list offers", () => {
      renderGate(formatTrsId(UNGATED_TRS_ID));
      expectContent();
    });

    test("renders the fallback for an unknown workflow", () => {
      renderGate("stale-workflow-id");
      expectFallback();
    });

    test("renders the fallback for a workflow in a gated category", () => {
      renderGate(formatTrsId(ASSEMBLY_TRS_ID));
      expectFallback();
    });

    test("renders children for gated workflows when the demo flag is on", () => {
      mockUseFeatureFlag.mockReturnValue(true);
      renderGate(formatTrsId(ASSEMBLY_TRS_ID));
      expectContent();
    });

    test("renders children for a workflow also listed under an ungated category", () => {
      renderGate(formatTrsId(SHARED_TRS_ID));
      expectContent();
    });

    test("renders the fallback for a workflow gated in its own right", () => {
      // The URL carries the formatted TRS ID; the rule must still match.
      renderGate(formatTrsId(HYPHY_TRS_ID));
      expectFallback();
    });

    test("renders the fallback for an organism-scope workflow, even when the demo flag is on", () => {
      mockUseFeatureFlag.mockReturnValue(true);
      renderGate(formatTrsId(ORGANISM_TRS_ID));
      expectFallback();
    });

    test("renders the fallback for a workflow outside the assembly's taxon", () => {
      mockUseFeatureFlag.mockReturnValue(true);
      renderGate(formatTrsId(OFF_TAXON_TRS_ID));
      expectFallback();
    });

    test("renders the fallback for an assembly-ID workflow on an assembly with no datacache", () => {
      renderGate(formatTrsId(NEEDS_DATACACHE_TRS_ID));
      expectFallback();
    });

    test("renders children for an assembly-ID workflow on an assembly with a datacache", () => {
      renderGate(
        formatTrsId(NEEDS_DATACACHE_TRS_ID),
        isAssemblyWorkflowAvailable,
        CACHED_ASSEMBLY_ID
      );
      expectContent();
    });

    test("renders children for Differential Expression Analysis, listed outside the catalog", () => {
      renderGate(DIFFERENTIAL_EXPRESSION_ANALYSIS.trsId);
      expectContent();
    });

    test("renders the fallback for a workflow outside the catalog that the assembly's list does not offer", () => {
      // Logan Search is configured on its own page, never here.
      mockUseFeatureFlag.mockReturnValue(true);
      renderGate(LOGAN_SEARCH.trsId);
      expectFallback();
    });

    test("renders the fallback for an unknown assembly", () => {
      renderGate(
        formatTrsId(UNGATED_TRS_ID),
        isAssemblyWorkflowAvailable,
        "unknown-assembly"
      );
      expectFallback();
    });

    test("renders the fallback when the workflow categories are not loaded", () => {
      // Only the by-id lookup is loaded; the category list is missing. The gate
      // must fail closed, and show the page's own fallback rather than throw.
      getEntitiesById().set(
        "workflows",
        indexWorkflowsById([
          buildWorkflowCategory(WORKFLOW_CATEGORY_ID.OTHER, [UNGATED_TRS_ID]),
        ])
      );
      getEntitiesByType().delete("workflows");

      renderGate(formatTrsId(UNGATED_TRS_ID));
      expectFallback();
    });
  });

  describe("on the organism configure page", () => {
    test("renders children for a workflow the organism's list offers", () => {
      renderOrganismGate(formatTrsId(ORGANISM_TRS_ID));
      expectContent();
    });

    test("renders the fallback for an assembly-scope workflow, even when the demo flag is on", () => {
      mockUseFeatureFlag.mockReturnValue(true);
      renderOrganismGate(formatTrsId(UNGATED_TRS_ID));
      expectFallback();
    });

    test("renders the fallback for an organism workflow in a gated category, and children when the demo flag is on", () => {
      getEntitiesByType().set("workflows", [
        buildWorkflowCategory(
          WORKFLOW_CATEGORY_ID.ASSEMBLY,
          [ORGANISM_TRS_ID],
          WORKFLOW_SCOPE.ORGANISM
        ),
      ]);

      renderOrganismGate(formatTrsId(ORGANISM_TRS_ID));
      expectFallback();

      mockUseFeatureFlag.mockReturnValue(true);
      cleanup();
      renderOrganismGate(formatTrsId(ORGANISM_TRS_ID));
      expectContent();
    });

    test("renders the fallback for a workflow outside the organism's taxon", () => {
      renderOrganismGate(formatTrsId(OFF_TAXON_ORGANISM_TRS_ID));
      expectFallback();
    });

    test("renders the fallback for an unknown organism", () => {
      renderGate(
        formatTrsId(ORGANISM_TRS_ID),
        isOrganismWorkflowAvailable,
        "unknown-organism"
      );
      expectFallback();
    });
  });
});
