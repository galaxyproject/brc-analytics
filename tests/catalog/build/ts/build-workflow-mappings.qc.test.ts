import {
  WORKFLOW_PLOIDY,
  WORKFLOW_SCOPE,
} from "@repo/shared/apis/schema-types";
import type { Workflow, WorkflowCategory } from "@repo/shared/apis/workflow";
import {
  AssemblyForTaxonomyCheck,
  generateWorkflowMappingsQC,
} from "../../../../catalog/build/ts/build-workflow-mappings";

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

describe("generateWorkflowMappingsQC - workflow taxonomy ID issues", () => {
  const noMappings: {
    compatibleAssemblyCount: number;
    workflowTrsId: string;
  }[] = [];

  const makeWorkflow = (
    name: string,
    trsId: string,
    taxonomyId: string | null
  ): Workflow => ({
    assemblyCountMax: 1,
    assemblyCountMin: 1,
    iwcId: "",
    parameters: [],
    ploidy: WORKFLOW_PLOIDY.ANY,
    scope: WORKFLOW_SCOPE.ASSEMBLY,
    taxonomyId,
    trsId,
    workflowDescription: "desc",
    workflowName: name,
  });

  const makeAssembly = (
    ncbiTaxonomyId: string,
    speciesTaxonomyId: string,
    extraLineageIds: string[] = []
  ): AssemblyForTaxonomyCheck => ({
    lineageTaxonomyIds: [
      ...extraLineageIds,
      speciesTaxonomyId,
      ncbiTaxonomyId,
    ].filter((v, i, a) => a.indexOf(v) === i),
    ncbiTaxonomyId,
    speciesTaxonomyId,
  });

  const assemblies = [
    makeAssembly("1000", "999", ["1", "10"]), // strain 1000, species 999
    makeAssembly("999", "999", ["1", "10"]), // assembly directly at species level
    makeAssembly("2000", "1999", ["1", "20"]), // strain 2000, species 1999
  ];

  const categories = (taxonomyId: string | null): WorkflowCategory[] => [
    {
      category: "Test",
      description: "d",
      name: "test",
      showComingSoon: false,
      workflows: [makeWorkflow("Taxon Wf", "#trs-taxon", taxonomyId)],
    },
  ];

  test("shows N/A when no assemblies are passed", () => {
    const report = generateWorkflowMappingsQC(
      noMappings,
      categories(null),
      "Test"
    );
    expect(report).toContain("N/A");
  });

  test("does not flag workflow with null taxonomyId", () => {
    const report = generateWorkflowMappingsQC(
      noMappings,
      categories(null),
      "Test",
      assemblies
    );
    expect(report).toContain("None");
    expect(report).not.toContain("Taxon Wf");
  });

  test("flags workflow whose taxonomyId is not in any assembly lineage", () => {
    const report = generateWorkflowMappingsQC(
      noMappings,
      categories("9999"),
      "Test",
      assemblies
    );
    expect(report).toContain("Taxon Wf");
    expect(report).toContain("not found in any assembly's lineage");
  });

  test("does not flag workflow whose taxonomyId is a speciesTaxonomyId", () => {
    const report = generateWorkflowMappingsQC(
      noMappings,
      categories("999"),
      "Test",
      assemblies
    );
    expect(report).toContain("None");
    expect(report).not.toContain("Taxon Wf");
  });

  test("flags workflow whose taxonomyId is only a sub-species ncbiTaxonomyId", () => {
    const report = generateWorkflowMappingsQC(
      noMappings,
      categories("1000"),
      "Test",
      assemblies
    );
    expect(report).toContain("Taxon Wf");
    expect(report).toContain("below species rank");
  });

  test("does not flag workflow whose taxonomyId is a genus/family ancestor (in lineage, not a direct assembly taxon)", () => {
    const report = generateWorkflowMappingsQC(
      noMappings,
      categories("10"),
      "Test",
      assemblies
    );
    expect(report).toContain("None");
    expect(report).not.toContain("Taxon Wf");
  });
});
