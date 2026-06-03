import type { WorkflowCategory } from "../../../app/apis/catalog/brc-analytics-catalog/common/entities";
import {
  WORKFLOW_PLOIDY,
  WORKFLOW_SCOPE,
} from "../../../app/apis/catalog/brc-analytics-catalog/common/schema-entities";
import { buildOrganismWorkflows } from "../../../app/views/OrganismView/components/Main/utils";
import type { Organism } from "../../../app/views/OrganismView/types";

describe("buildOrganismWorkflows", () => {
  const ORGANISM: Organism = {
    assemblyCount: 2,
    genomes: [
      { lineageTaxonomyIds: ["1", "10239", "11320", "130760"] },
      { lineageTaxonomyIds: ["1", "10239", "11320", "93838"] },
    ],
    ncbiTaxonomyId: "2955291",
    taxonomicLevelSpecies: "Alphainfluenzavirus influenzae",
  };

  test("includes workflows with ORGANISM scope and matching taxonomy", () => {
    const categories: WorkflowCategory[] = [
      {
        category: "Test Category",
        description: "desc",
        name: "test-category",
        showComingSoon: false,
        workflows: [
          {
            assemblyCountMax: 0,
            assemblyCountMin: 0,
            iwcId: "iwc-organism",
            parameters: [],
            ploidy: WORKFLOW_PLOIDY.ANY,
            scope: WORKFLOW_SCOPE.ORGANISM,
            taxonomyId: "11320",
            trsId: "#trs-organism",
            workflowDescription: "organism workflow",
            workflowName: "Organism Workflow",
          },
        ],
      },
    ];

    const result = buildOrganismWorkflows(ORGANISM, categories);

    expect(result).toHaveLength(1);
    expect(result[0].workflows).toHaveLength(1);
    expect(result[0].workflows[0].trsId).toBe("#trs-organism");
  });

  test("includes workflows with null taxonomyId (matches any organism)", () => {
    const categories: WorkflowCategory[] = [
      {
        category: "Test Category",
        description: "desc",
        name: "test-category",
        showComingSoon: false,
        workflows: [
          {
            assemblyCountMax: 0,
            assemblyCountMin: 0,
            iwcId: "iwc-universal",
            parameters: [],
            ploidy: WORKFLOW_PLOIDY.ANY,
            scope: WORKFLOW_SCOPE.ORGANISM,
            taxonomyId: null,
            trsId: "#trs-universal",
            workflowDescription: "universal organism workflow",
            workflowName: "Universal Workflow",
          },
        ],
      },
    ];

    const result = buildOrganismWorkflows(ORGANISM, categories);

    expect(result).toHaveLength(1);
    expect(result[0].workflows).toHaveLength(1);
  });

  test("excludes workflows with ASSEMBLY scope", () => {
    const categories: WorkflowCategory[] = [
      {
        category: "Test Category",
        description: "desc",
        name: "test-category",
        showComingSoon: false,
        workflows: [
          {
            assemblyCountMax: 1,
            assemblyCountMin: 1,
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

    const result = buildOrganismWorkflows(ORGANISM, categories);

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
            assemblyCountMax: 0,
            assemblyCountMin: 0,
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

    const result = buildOrganismWorkflows(ORGANISM, categories);

    expect(result).toHaveLength(0);
  });

  test("excludes workflows with non-matching taxonomyId", () => {
    const categories: WorkflowCategory[] = [
      {
        category: "Test Category",
        description: "desc",
        name: "test-category",
        showComingSoon: false,
        workflows: [
          {
            assemblyCountMax: 0,
            assemblyCountMin: 0,
            iwcId: "iwc-other",
            parameters: [],
            ploidy: WORKFLOW_PLOIDY.ANY,
            scope: WORKFLOW_SCOPE.ORGANISM,
            taxonomyId: "99999",
            trsId: "#trs-other",
            workflowDescription: "other organism workflow",
            workflowName: "Other Workflow",
          },
        ],
      },
    ];

    const result = buildOrganismWorkflows(ORGANISM, categories);

    expect(result).toHaveLength(0);
  });

  test("matches taxonomyId present in any genome lineage", () => {
    const categories: WorkflowCategory[] = [
      {
        category: "Test Category",
        description: "desc",
        name: "test-category",
        showComingSoon: false,
        workflows: [
          {
            assemblyCountMax: 0,
            assemblyCountMin: 0,
            iwcId: "iwc-leaf",
            parameters: [],
            ploidy: WORKFLOW_PLOIDY.ANY,
            scope: WORKFLOW_SCOPE.ORGANISM,
            taxonomyId: "93838",
            trsId: "#trs-leaf",
            workflowDescription: "leaf taxonomy workflow",
            workflowName: "Leaf Workflow",
          },
        ],
      },
    ];

    const result = buildOrganismWorkflows(ORGANISM, categories);

    expect(result).toHaveLength(1);
    expect(result[0].workflows[0].trsId).toBe("#trs-leaf");
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
            assemblyCountMax: 0,
            assemblyCountMin: 0,
            iwcId: "iwc-organism",
            parameters: [],
            ploidy: WORKFLOW_PLOIDY.ANY,
            scope: WORKFLOW_SCOPE.ORGANISM,
            taxonomyId: "11320",
            trsId: "#trs-organism",
            workflowDescription: "organism workflow",
            workflowName: "Organism Workflow",
          },
          {
            assemblyCountMax: 1,
            assemblyCountMin: 1,
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

    const result = buildOrganismWorkflows(ORGANISM, categories);

    expect(result).toHaveLength(1);
    expect(result[0].workflows).toHaveLength(1);
    expect(result[0].workflows[0].scope).toBe(WORKFLOW_SCOPE.ORGANISM);
  });

  test("returns empty array for organism with no genomes", () => {
    const emptyOrganism: Organism = {
      assemblyCount: 0,
      genomes: [],
      ncbiTaxonomyId: "0",
      taxonomicLevelSpecies: "Empty Organism",
    };

    const categories: WorkflowCategory[] = [
      {
        category: "Test Category",
        description: "desc",
        name: "test-category",
        showComingSoon: false,
        workflows: [
          {
            assemblyCountMax: 0,
            assemblyCountMin: 0,
            iwcId: "iwc-organism",
            parameters: [],
            ploidy: WORKFLOW_PLOIDY.ANY,
            scope: WORKFLOW_SCOPE.ORGANISM,
            taxonomyId: "11320",
            trsId: "#trs-organism",
            workflowDescription: "organism workflow",
            workflowName: "Organism Workflow",
          },
        ],
      },
    ];

    const result = buildOrganismWorkflows(emptyOrganism, categories);

    expect(result).toHaveLength(0);
  });
});
