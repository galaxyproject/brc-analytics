import {
  Workflow,
  WorkflowCategory,
} from "../../../../app/apis/catalog/brc-analytics-catalog/common/entities";
import {
  WORKFLOW_PLOIDY,
  WORKFLOW_SCOPE,
} from "../../../../app/apis/catalog/brc-analytics-catalog/common/schema-entities";
import { generateWorkflowMappingsQC } from "../../../../catalog/build/ts/build-workflow-mappings";

describe("generateWorkflowMappingsQC - assembly count aware", () => {
  const makeWorkflow = (
    name: string,
    trsId: string,
    scope: WORKFLOW_SCOPE,
    assemblyCountMin: number
  ): Workflow => ({
    assemblyCountMax: scope === WORKFLOW_SCOPE.ASSEMBLY ? 1 : 0,
    assemblyCountMin,
    iwcId: "",
    parameters: [],
    ploidy: WORKFLOW_PLOIDY.ANY,
    scope,
    taxonomyId: null,
    trsId,
    workflowDescription: "desc",
    workflowName: name,
  });

  const categories: WorkflowCategory[] = [
    {
      category: "Test",
      description: "d",
      name: "test",
      showComingSoon: false,
      workflows: [
        makeWorkflow(
          "Assembly Wf",
          "#trs-assembly",
          WORKFLOW_SCOPE.ASSEMBLY,
          1
        ),
        makeWorkflow(
          "Organism Wf",
          "#trs-organism",
          WORKFLOW_SCOPE.ORGANISM,
          0
        ),
        makeWorkflow("Hyphy Wf", "#trs-hyphy", WORKFLOW_SCOPE.ORGANISM, 2),
      ],
    },
  ];

  test("does not flag assembly-independent workflows (min 0)", () => {
    const mappings = [
      { compatibleAssemblyCount: 0, workflowTrsId: "#trs-organism" },
    ];
    const report = generateWorkflowMappingsQC(mappings, categories, "Test");
    expect(report).toContain(
      "Workflows that cannot meet their minimum assembly requirement"
    );
    expect(report).not.toContain("Organism Wf");
  });

  test("flags ASSEMBLY workflow with 0 compatible assemblies", () => {
    const mappings = [
      { compatibleAssemblyCount: 0, workflowTrsId: "#trs-assembly" },
      { compatibleAssemblyCount: 0, workflowTrsId: "#trs-organism" },
      { compatibleAssemblyCount: 5, workflowTrsId: "#trs-hyphy" },
    ];
    const report = generateWorkflowMappingsQC(mappings, categories, "Test");
    expect(report).toContain("Assembly Wf");
    expect(report).not.toContain("Organism Wf");
    expect(report).not.toContain("Hyphy Wf");
  });

  test("flags workflow with insufficient assemblies (0 < count < min)", () => {
    const mappings = [
      { compatibleAssemblyCount: 5, workflowTrsId: "#trs-assembly" },
      { compatibleAssemblyCount: 0, workflowTrsId: "#trs-organism" },
      { compatibleAssemblyCount: 1, workflowTrsId: "#trs-hyphy" },
    ];
    const report = generateWorkflowMappingsQC(mappings, categories, "Test");
    expect(report).toContain("Hyphy Wf");
    expect(report).toContain("needs >= 2, 1 compatible");
    expect(report).not.toContain("Assembly Wf");
    expect(report).not.toContain("Organism Wf");
  });

  test("does not flag workflows that meet their minimum", () => {
    const mappings = [
      { compatibleAssemblyCount: 5, workflowTrsId: "#trs-assembly" },
      { compatibleAssemblyCount: 0, workflowTrsId: "#trs-organism" },
      { compatibleAssemblyCount: 5, workflowTrsId: "#trs-hyphy" },
    ];
    const report = generateWorkflowMappingsQC(mappings, categories, "Test");
    expect(report).toContain("None");
    expect(report).not.toContain("Assembly Wf");
    expect(report).not.toContain("Organism Wf");
    expect(report).not.toContain("Hyphy Wf");
  });
});
