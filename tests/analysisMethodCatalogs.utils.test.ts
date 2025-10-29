import {
  ORGANISM_PLOIDY,
  WORKFLOW_PLOIDY,
} from "../app/apis/catalog/brc-analytics-catalog/common/schema-entities";
import type {
  BRCDataCatalogGenome,
  WorkflowCategory,
} from "../app/apis/catalog/brc-analytics-catalog/common/entities";
import { buildAssemblyWorkflows } from "../app/components/Entity/components/AnalysisMethodsCatalog/utils";

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
      WORKFLOW_CATEGORIES
    );

    expect(result.map((c) => c.category)).toEqual([
      "Mapped Reads",
      "Variant Analysis",
    ]);

    expect(result[0].workflows.map((w) => w.iwcId)).toEqual(["iwc-any"]);
    expect(result[1].workflows).toHaveLength(0);
    expect(result.find((c) => c.category === "Omit Me")).toBeUndefined();
  });
});
