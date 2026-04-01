import type {
  WorkflowAssemblyMapping,
  WorkflowCategory,
} from "../../../app/apis/catalog/brc-analytics-catalog/common/entities";
import {
  WORKFLOW_PLOIDY,
  WORKFLOW_SCOPE,
} from "../../../app/apis/catalog/brc-analytics-catalog/common/schema-entities";
import { getWorkflows } from "../../../app/views/WorkflowsView/utils";
import type { Organism } from "../../../app/views/WorkflowsView/types";

jest.mock(
  "../../../app/views/AnalyzeWorkflowsView/differentialExpressionAnalysis/constants",
  () => ({
    DIFFERENTIAL_EXPRESSION_ANALYSIS: {
      iwcId: "iwc-deseq2",
      parameters: [],
      ploidy: "ANY",
      scope: "ASSEMBLY",
      taxonomyId: null,
      trsId: "differential-expression-analysis",
      workflowDescription: "DESeq2 workflow",
      workflowName: "Differential Expression Analysis",
    },
  })
);

describe("getWorkflows - scope handling", () => {
  const ORGANISMS: Organism[] = [];
  const MAPPINGS: WorkflowAssemblyMapping[] = [
    {
      compatibleAssemblyCount: 1,
      workflowTrsId: "#trs-assembly",
    },
    {
      compatibleAssemblyCount: 1,
      workflowTrsId: "#trs-organism",
    },
    {
      compatibleAssemblyCount: 1,
      workflowTrsId: "#trs-sequence",
    },
    {
      compatibleAssemblyCount: 1,
      workflowTrsId: "#trs-no-scope",
    },
  ];

  test("includes scope field in workflow entities", () => {
    const categories: WorkflowCategory[] = [
      {
        category: "Test Category",
        description: "desc",
        name: "Test",
        showComingSoon: false,
        workflows: [
          {
            iwcId: "iwc-assembly",
            parameters: [],
            ploidy: WORKFLOW_PLOIDY.ANY,
            scope: WORKFLOW_SCOPE.ASSEMBLY,
            taxonomyId: null,
            trsId: "#trs-assembly",
            workflowDescription: "assembly workflow",
            workflowName: "Assembly Workflow",
          },
        ],
      },
    ];

    const result = getWorkflows(categories, MAPPINGS, ORGANISMS);

    expect(result).toHaveLength(2); // 1 workflow + DEA
    expect(result[0].scope).toBeDefined();
    expect(result[0].scope).toBe("ASSEMBLY");
  });

  test("converts ASSEMBLY scope to string 'ASSEMBLY'", () => {
    const categories: WorkflowCategory[] = [
      {
        category: "Test Category",
        description: "desc",
        name: "Test",
        showComingSoon: false,
        workflows: [
          {
            iwcId: "iwc-assembly",
            parameters: [],
            ploidy: WORKFLOW_PLOIDY.ANY,
            scope: WORKFLOW_SCOPE.ASSEMBLY,
            taxonomyId: null,
            trsId: "#trs-assembly",
            workflowDescription: "assembly workflow",
            workflowName: "Assembly Workflow",
          },
        ],
      },
    ];

    const result = getWorkflows(categories, MAPPINGS, ORGANISMS);

    expect(result[0].scope).toBe("ASSEMBLY");
    expect(typeof result[0].scope).toBe("string");
  });

  test("converts ORGANISM scope to string 'ORGANISM'", () => {
    const categories: WorkflowCategory[] = [
      {
        category: "Test Category",
        description: "desc",
        name: "Test",
        showComingSoon: false,
        workflows: [
          {
            iwcId: "iwc-organism",
            parameters: [],
            ploidy: WORKFLOW_PLOIDY.ANY,
            scope: WORKFLOW_SCOPE.ORGANISM,
            taxonomyId: null,
            trsId: "#trs-organism",
            workflowDescription: "organism workflow",
            workflowName: "Organism Workflow",
          },
        ],
      },
    ];

    const result = getWorkflows(categories, MAPPINGS, ORGANISMS);

    expect(result[0].scope).toBe("ORGANISM");
  });

  test("converts SEQUENCE scope to string 'SEQUENCE'", () => {
    const categories: WorkflowCategory[] = [
      {
        category: "Test Category",
        description: "desc",
        name: "Test",
        showComingSoon: false,
        workflows: [
          {
            iwcId: "iwc-sequence",
            parameters: [],
            ploidy: WORKFLOW_PLOIDY.ANY,
            scope: WORKFLOW_SCOPE.SEQUENCE,
            taxonomyId: null,
            trsId: "#trs-sequence",
            workflowDescription: "sequence workflow",
            workflowName: "Sequence Workflow",
          },
        ],
      },
    ];

    const result = getWorkflows(categories, MAPPINGS, ORGANISMS);

    expect(result[0].scope).toBe("SEQUENCE");
  });

  test("defaults undefined scope to 'ASSEMBLY'", () => {
    const categories: WorkflowCategory[] = [
      {
        category: "Test Category",
        description: "desc",
        name: "Test",
        showComingSoon: false,
        workflows: [
          {
            iwcId: "iwc-no-scope",
            parameters: [],
            ploidy: WORKFLOW_PLOIDY.ANY,
            scope: WORKFLOW_SCOPE.ASSEMBLY,
            taxonomyId: null,
            trsId: "#trs-no-scope",
            workflowDescription: "workflow without scope",
            workflowName: "No Scope Workflow",
          },
        ],
      },
    ];

    const result = getWorkflows(categories, MAPPINGS, ORGANISMS);

    expect(result[0].scope).toBe("ASSEMBLY");
  });

  test("handles mixed scope workflows in same category", () => {
    const categories: WorkflowCategory[] = [
      {
        category: "Mixed Category",
        description: "desc",
        name: "Mixed",
        showComingSoon: false,
        workflows: [
          {
            iwcId: "iwc-assembly",
            parameters: [],
            ploidy: WORKFLOW_PLOIDY.ANY,
            scope: WORKFLOW_SCOPE.ASSEMBLY,
            taxonomyId: null,
            trsId: "#trs-assembly",
            workflowDescription: "assembly workflow",
            workflowName: "Assembly Workflow",
          },
          {
            iwcId: "iwc-organism",
            parameters: [],
            ploidy: WORKFLOW_PLOIDY.ANY,
            scope: WORKFLOW_SCOPE.ORGANISM,
            taxonomyId: null,
            trsId: "#trs-organism",
            workflowDescription: "organism workflow",
            workflowName: "Organism Workflow",
          },
          {
            iwcId: "iwc-sequence",
            parameters: [],
            ploidy: WORKFLOW_PLOIDY.ANY,
            scope: WORKFLOW_SCOPE.SEQUENCE,
            taxonomyId: null,
            trsId: "#trs-sequence",
            workflowDescription: "sequence workflow",
            workflowName: "Sequence Workflow",
          },
        ],
      },
    ];

    const result = getWorkflows(categories, MAPPINGS, ORGANISMS);

    expect(result).toHaveLength(4); // 3 workflows + DEA
    expect(result.map((w) => w.scope)).toContain("ASSEMBLY");
    expect(result.map((w) => w.scope)).toContain("ORGANISM");
    expect(result.map((w) => w.scope)).toContain("SEQUENCE");
  });

  test("DIFFERENTIAL_EXPRESSION_ANALYSIS has ASSEMBLY scope", () => {
    const categories: WorkflowCategory[] = [];

    const result = getWorkflows(categories, MAPPINGS, ORGANISMS);

    const dea = result.find(
      (w) => w.trsId === "differential-expression-analysis"
    );
    expect(dea).toBeDefined();
    expect(dea?.scope).toBe("ASSEMBLY");
  });

  test("filters out workflows with no compatible assemblies", () => {
    const categories: WorkflowCategory[] = [
      {
        category: "Test Category",
        description: "desc",
        name: "Test",
        showComingSoon: false,
        workflows: [
          {
            iwcId: "iwc-no-assemblies",
            parameters: [],
            ploidy: WORKFLOW_PLOIDY.ANY,
            scope: WORKFLOW_SCOPE.ASSEMBLY,
            taxonomyId: null,
            trsId: "#trs-no-assemblies",
            workflowDescription: "workflow with no assemblies",
            workflowName: "No Assemblies Workflow",
          },
        ],
      },
    ];

    const mappingsWithoutWorkflow: WorkflowAssemblyMapping[] = [];

    const result = getWorkflows(categories, mappingsWithoutWorkflow, ORGANISMS);

    // Should only include DEA
    expect(result).toHaveLength(1);
    expect(result[0].trsId).toBe("differential-expression-analysis");
  });
});
