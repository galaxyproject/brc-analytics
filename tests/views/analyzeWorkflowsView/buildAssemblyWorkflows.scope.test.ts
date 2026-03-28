import type {
  BRCDataCatalogGenome,
  WorkflowCategory,
} from "../../../app/apis/catalog/brc-analytics-catalog/common/entities";
import {
  ORGANISM_PLOIDY,
  WORKFLOW_PLOIDY,
  WORKFLOW_SCOPE,
} from "../../../app/apis/catalog/brc-analytics-catalog/common/schema-entities";
import { buildAssemblyWorkflows } from "../../../app/views/AnalyzeWorkflowsView/components/Main/utils";
import { DIFFERENTIAL_EXPRESSION_ANALYSIS } from "../../../app/views/AnalyzeWorkflowsView/differentialExpressionAnalysis/constants";
import { WorkflowCategoryId } from "../../../catalog/schema/generated/schema";

describe("buildAssemblyWorkflows - scope filtering", () => {
  const ASSEMBLY: BRCDataCatalogGenome = {
    accession: "AC",
    annotationStatus: null,
    chromosomes: null,
    commonName: null,
    coverage: null,
    galaxyDatacacheUrl: null,
    gcPercent: null,
    geneModelUrl: null,
    isRef: "Yes",
    length: 0,
    level: "scaffold",
    lineageTaxonomyIds: ["999"],
    ncbiTaxonomyId: "123",
    otherTaxa: null,
    ploidy: [ORGANISM_PLOIDY.DIPLOID],
    priority: null,
    priorityPathogenName: null,
    scaffoldCount: null,
    scaffoldL50: null,
    scaffoldN50: null,
    speciesTaxonomyId: "123",
    strainName: null,
    taxonomicGroup: [],
    taxonomicLevelClass: "",
    taxonomicLevelDomain: "",
    taxonomicLevelFamily: "",
    taxonomicLevelGenus: "",
    taxonomicLevelIsolate: "",
    taxonomicLevelKingdom: "",
    taxonomicLevelOrder: "",
    taxonomicLevelPhylum: "",
    taxonomicLevelRealm: "",
    taxonomicLevelSerotype: "",
    taxonomicLevelSpecies: "",
    taxonomicLevelStrain: "",
    ucscBrowserUrl: null,
  };

  test("includes workflows with ASSEMBLY scope", () => {
    const categories: WorkflowCategory[] = [
      {
        category: "Test Category",
        description: "desc",
        name: "test-category",
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

    const result = buildAssemblyWorkflows(ASSEMBLY, categories);

    expect(result).toHaveLength(1);
    expect(result[0].workflows).toHaveLength(1);
    expect(result[0].workflows[0].trsId).toBe("#trs-assembly");
  });

  test("includes workflows with undefined scope (defaults to ASSEMBLY)", () => {
    const categories: WorkflowCategory[] = [
      {
        category: "Test Category",
        description: "desc",
        name: "test-category",
        showComingSoon: false,
        workflows: [
          {
            iwcId: "iwc-no-scope",
            parameters: [],
            ploidy: WORKFLOW_PLOIDY.ANY,
            taxonomyId: null,
            trsId: "#trs-no-scope",
            workflowDescription: "workflow without scope",
            workflowName: "No Scope Workflow",
          },
        ],
      },
    ];

    const result = buildAssemblyWorkflows(ASSEMBLY, categories);

    expect(result).toHaveLength(1);
    expect(result[0].workflows).toHaveLength(1);
    expect(result[0].workflows[0].trsId).toBe("#trs-no-scope");
  });

  test("excludes workflows with ORGANISM scope", () => {
    const categories: WorkflowCategory[] = [
      {
        category: "Test Category",
        description: "desc",
        name: "test-category",
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

    const result = buildAssemblyWorkflows(ASSEMBLY, categories);

    // Category should be omitted because it has no compatible workflows
    expect(result).toHaveLength(0);
  });

  test("excludes workflows with SEQUENCE scope", () => {
    const categories: WorkflowCategory[] = [
      {
        category: "Test Category",
        description: "desc",
        name: "test-category",
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

    const result = buildAssemblyWorkflows(ASSEMBLY, categories);

    // Category should be omitted because it has no compatible workflows
    expect(result).toHaveLength(0);
  });

  test("filters mixed scope workflows correctly", () => {
    const categories: WorkflowCategory[] = [
      {
        category: "Mixed Category",
        description: "desc",
        name: "mixed-category",
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

    const result = buildAssemblyWorkflows(ASSEMBLY, categories);

    expect(result).toHaveLength(1);
    expect(result[0].workflows).toHaveLength(1);
    expect(result[0].workflows[0].scope).toBe(WORKFLOW_SCOPE.ASSEMBLY);
  });

  test("DIFFERENTIAL_EXPRESSION_ANALYSIS has ASSEMBLY scope", () => {
    // Verify the hardcoded workflow has the correct scope
    expect(DIFFERENTIAL_EXPRESSION_ANALYSIS.scope).toBe(
      WORKFLOW_SCOPE.ASSEMBLY
    );
  });

  test("includes DIFFERENTIAL_EXPRESSION_ANALYSIS in transcriptomics category", () => {
    const categories: WorkflowCategory[] = [
      {
        category: WorkflowCategoryId.TRANSCRIPTOMICS,
        description: "desc",
        name: "transcriptomics",
        showComingSoon: false,
        workflows: [
          {
            iwcId: "iwc-rna-seq",
            parameters: [],
            ploidy: WORKFLOW_PLOIDY.ANY,
            scope: WORKFLOW_SCOPE.ASSEMBLY,
            taxonomyId: null,
            trsId: "#trs-rna-seq",
            workflowDescription: "rna-seq workflow",
            workflowName: "RNA-seq Workflow",
          },
        ],
      },
    ];

    const result = buildAssemblyWorkflows(ASSEMBLY, categories);

    const transcriptomics = result.find(
      ({ category }) => category === WorkflowCategoryId.TRANSCRIPTOMICS
    );

    expect(transcriptomics).toBeDefined();
    expect(transcriptomics?.workflows).toHaveLength(2);
    expect(transcriptomics?.workflows[0].trsId).toBe(
      DIFFERENTIAL_EXPRESSION_ANALYSIS.trsId
    );
    expect(transcriptomics?.workflows[0].scope).toBe(WORKFLOW_SCOPE.ASSEMBLY);
  });

  test("keeps showComingSoon categories even with no ASSEMBLY workflows", () => {
    const categories: WorkflowCategory[] = [
      {
        category: "Coming Soon",
        description: "desc",
        name: "coming-soon",
        showComingSoon: true,
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

    const result = buildAssemblyWorkflows(ASSEMBLY, categories);

    // Category should be included because showComingSoon is true
    expect(result).toHaveLength(1);
    expect(result[0].workflows).toHaveLength(0);
    expect(result[0].showComingSoon).toBe(true);
  });
});
