import {
  ORGANISM_PLOIDY,
  WORKFLOW_PLOIDY,
} from "../app/apis/catalog/brc-analytics-catalog/common/schema-entities";
import type {
  BRCDataCatalogGenome,
  WorkflowCategory,
} from "../app/apis/catalog/brc-analytics-catalog/common/entities";
import { buildAssemblyWorkflows } from "../app/components/Entity/components/AnalysisMethodsCatalog/utils";
import { WorkflowCategoryId } from "../catalog/schema/generated/schema";
import { DIFFERENTIAL_EXPRESSION_ANALYSIS } from "app/components/Entity/components/AnalysisMethod/components/DifferentialExpressionAnalysis/constants";

describe("buildAssemblyWorkflows", () => {
  const WORKFLOW_CATEGORIES: WorkflowCategory[] = [
    {
      category: "Mapped Reads",
      description: "desc",
      name: "mapped-reads",
      showComingSoon: false,
      workflows: [
        {
          iwcId: "iwc-any",
          parameters: [],
          ploidy: WORKFLOW_PLOIDY.ANY,
          taxonomyId: null,
          trsId: "#trs-any",
          workflowDescription: "any compatible",
          workflowName: "ANY Workflow",
        },
        {
          iwcId: "iwc-haploid-999",
          parameters: [],
          ploidy: WORKFLOW_PLOIDY.HAPLOID,
          taxonomyId: "999",
          trsId: "#trs-haploid",
          workflowDescription: "haploid",
          workflowName: "HAPLOID Workflow",
        },
      ],
    },
    {
      category: "Variant Analysis",
      description: "desc",
      name: "variant-analysis",
      showComingSoon: true,
      workflows: [
        {
          iwcId: "iwc-diploid-not-lineage",
          parameters: [],
          ploidy: WORKFLOW_PLOIDY.DIPLOID,
          taxonomyId: "not-in-lineage",
          trsId: "#trs-diploid",
          workflowDescription: "diploid",
          workflowName: "DIPLOID Workflow",
        },
      ],
    },
    {
      category: "Omit Me",
      description: "desc",
      name: "omit-me",
      showComingSoon: false,
      workflows: [
        {
          iwcId: "iwc-haploid-other",
          parameters: [],
          ploidy: WORKFLOW_PLOIDY.HAPLOID,
          taxonomyId: "other",
          trsId: "#trs-other",
          workflowDescription: "incompatible haploid",
          workflowName: "HAPLOID Other",
        },
      ],
    },
    {
      category: "TRANSCRIPTOMICS",
      description: "desc",
      name: "transcriptomics",
      showComingSoon: false,
      workflows: [
        {
          iwcId: "iwc-transcriptomics-any",
          parameters: [],
          ploidy: WORKFLOW_PLOIDY.ANY,
          taxonomyId: null,
          trsId: "#trs-transcriptomics",
          workflowDescription: "transcriptomics workflow",
          workflowName: "RNA-seq Workflow",
        },
      ],
    },
  ];

  const DIPLOID_ASSEMBLY: BRCDataCatalogGenome = {
    accession: "AC",
    annotationStatus: null,
    chromosomes: null,
    commonName: null,
    coverage: null,
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

  test("filters and sorts workflow categories", () => {
    const result = buildAssemblyWorkflows(
      DIPLOID_ASSEMBLY,
      WORKFLOW_CATEGORIES,
      false
    );

    expect(result.map((c) => c.category)).toEqual([
      "Mapped Reads",
      "TRANSCRIPTOMICS",
      "Variant Analysis",
    ]);

    expect(result[0].workflows.map((w) => w.iwcId)).toEqual(["iwc-any"]);
    expect(result[2].workflows).toHaveLength(0);
    expect(result.find((c) => c.category === "Omit Me")).toBeUndefined();
  });

  test("excludes differential expression workflow when isDEEnabled is false", () => {
    const result = buildAssemblyWorkflows(
      DIPLOID_ASSEMBLY,
      WORKFLOW_CATEGORIES,
      false
    );

    const transcriptomics = result.find(
      ({ category }) => category === WorkflowCategoryId.TRANSCRIPTOMICS
    );

    expect(transcriptomics).toBeDefined();
    expect(
      transcriptomics?.workflows.find(
        ({ trsId }) => trsId === DIFFERENTIAL_EXPRESSION_ANALYSIS.trsId
      )
    ).toBeUndefined();
  });

  test("includes differential expression workflow as first in transcriptomics when isDEEnabled is true", () => {
    const result = buildAssemblyWorkflows(
      DIPLOID_ASSEMBLY,
      WORKFLOW_CATEGORIES,
      true
    );

    const transcriptomics = result.find(
      ({ category }) => category === WorkflowCategoryId.TRANSCRIPTOMICS
    );

    expect(transcriptomics).toBeDefined();
    expect(transcriptomics?.workflows[0].trsId).toBe(
      DIFFERENTIAL_EXPRESSION_ANALYSIS.trsId
    );
    expect(transcriptomics?.workflows[0].workflowName).toBe(
      DIFFERENTIAL_EXPRESSION_ANALYSIS.workflowName
    );
  });
});
