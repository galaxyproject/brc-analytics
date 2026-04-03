import type { Workflow } from "../../../app/apis/catalog/brc-analytics-catalog/common/entities";
import {
  WORKFLOW_PARAMETER_VARIABLE,
  WORKFLOW_PLOIDY,
  WORKFLOW_SCOPE,
} from "../../../app/apis/catalog/brc-analytics-catalog/common/schema-entities";
import { getConfiguredValues } from "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/hooks/UseLaunchGalaxy/utils";
import type { ConfiguredInput } from "../../../app/views/WorkflowInputsView/hooks/UseConfigureInputs/types";

// Mock workflow constants to avoid pulling in unneeded modules
jest.mock(
  "../../../app/views/AnalyzeWorkflowsView/differentialExpressionAnalysis/constants",
  () => ({
    DIFFERENTIAL_EXPRESSION_ANALYSIS: {
      trsId: "differential-expression-analysis",
    },
  })
);

jest.mock(
  "../../../app/views/AnalyzeWorkflowsView/loganSearch/constants",
  () => ({
    LOGAN_SEARCH: {
      trsId: "logan-search",
    },
  })
);

jest.mock("../../../app/views/AnalyzeWorkflowsView/lexicmap/constants", () => ({
  LEXICMAP: {
    trsId: "lexicmap",
  },
}));

describe("getConfiguredValues - scope-based logic", () => {
  const BASE_WORKFLOW: Workflow = {
    iwcId: "iwc-test",
    parameters: [],
    ploidy: WORKFLOW_PLOIDY.ANY,
    scope: WORKFLOW_SCOPE.ASSEMBLY,
    taxonomyId: null,
    trsId: "#trs-test",
    workflowDescription: "test workflow",
    workflowName: "Test Workflow",
  };

  const BASE_CONFIGURED_INPUT: ConfiguredInput = {
    designFormula: undefined,
    geneModelUrl: null,
    primaryContrasts: null,
    readRunsPaired: null,
    readRunsSingle: null,
    referenceAssembly: undefined,
    sampleSheet: undefined,
    sampleSheetClassification: undefined,
    strandedness: undefined,
    tracks: null,
  };

  describe("ASSEMBLY scope", () => {
    test("returns AssemblyConfiguredValue with _scope discriminant", () => {
      const workflow: Workflow = {
        ...BASE_WORKFLOW,
        parameters: [],
        scope: WORKFLOW_SCOPE.ASSEMBLY,
      };

      const configuredInput: ConfiguredInput = {
        ...BASE_CONFIGURED_INPUT,
        referenceAssembly: "GCF_000001405.40",
      };

      const result = getConfiguredValues(configuredInput, workflow);

      expect(result).toBeDefined();
      expect(result?._scope).toBe("ASSEMBLY");
      expect(result).toHaveProperty("referenceAssembly", "GCF_000001405.40");
    });

    test("returns undefined when required ASSEMBLY_FASTA_URL param is missing", () => {
      const workflow: Workflow = {
        ...BASE_WORKFLOW,
        parameters: [
          {
            key: "Reference genome",
            variable: WORKFLOW_PARAMETER_VARIABLE.ASSEMBLY_FASTA_URL,
          },
        ],
        scope: WORKFLOW_SCOPE.ASSEMBLY,
      };

      const configuredInput: ConfiguredInput = {
        ...BASE_CONFIGURED_INPUT,
        referenceAssembly: undefined, // Missing required value
      };

      const result = getConfiguredValues(configuredInput, workflow);

      expect(result).toBeUndefined();
    });

    test("returns value when all required params are provided", () => {
      const workflow: Workflow = {
        ...BASE_WORKFLOW,
        parameters: [
          {
            key: "Reference genome",
            variable: WORKFLOW_PARAMETER_VARIABLE.ASSEMBLY_FASTA_URL,
          },
          {
            key: "Gene model",
            variable: WORKFLOW_PARAMETER_VARIABLE.GENE_MODEL_URL,
          },
        ],
        scope: WORKFLOW_SCOPE.ASSEMBLY,
      };

      const configuredInput: ConfiguredInput = {
        ...BASE_CONFIGURED_INPUT,
        geneModelUrl: "https://example.com/genes.gff",
        referenceAssembly: "GCF_000001405.40",
      };

      const result = getConfiguredValues(configuredInput, workflow);

      expect(result).toBeDefined();
      expect(result?._scope).toBe("ASSEMBLY");
    });
  });

  describe("ORGANISM scope", () => {
    test("returns OrganismConfiguredValue with _scope discriminant", () => {
      const workflow: Workflow = {
        ...BASE_WORKFLOW,
        scope: WORKFLOW_SCOPE.ORGANISM,
      };

      const result = getConfiguredValues(BASE_CONFIGURED_INPUT, workflow);

      expect(result).toBeDefined();
      expect(result?._scope).toBe("ORGANISM");
    });

    test("returns OrganismConfiguredValue with fastaCollection property", () => {
      const workflow: Workflow = {
        ...BASE_WORKFLOW,
        scope: WORKFLOW_SCOPE.ORGANISM,
      };

      const result = getConfiguredValues(BASE_CONFIGURED_INPUT, workflow);

      expect(result).toBeDefined();
      expect(result).toHaveProperty("fastaCollection", null);
    });

    test("always returns value regardless of configuredInput (no validation)", () => {
      const workflow: Workflow = {
        ...BASE_WORKFLOW,
        scope: WORKFLOW_SCOPE.ORGANISM,
      };

      // Even with empty/null inputs, ORGANISM scope should return a value
      const result = getConfiguredValues(BASE_CONFIGURED_INPUT, workflow);

      expect(result).toBeDefined();
    });
  });

  describe("SEQUENCE scope", () => {
    test("returns SequenceConfiguredValue with _scope discriminant", () => {
      const workflow: Workflow = {
        ...BASE_WORKFLOW,
        scope: WORKFLOW_SCOPE.SEQUENCE,
      };

      const result = getConfiguredValues(BASE_CONFIGURED_INPUT, workflow);

      expect(result).toBeDefined();
      expect(result?._scope).toBe("SEQUENCE");
    });

    test("returns SequenceConfiguredValue with numberOfHits and sequence", () => {
      const workflow: Workflow = {
        ...BASE_WORKFLOW,
        scope: WORKFLOW_SCOPE.SEQUENCE,
      };

      const result = getConfiguredValues(BASE_CONFIGURED_INPUT, workflow);

      expect(result).toBeDefined();
      expect(result).toHaveProperty("numberOfHits", 10);
      expect(result).toHaveProperty("sequence", "");
    });

    test("always returns value regardless of configuredInput (no validation)", () => {
      const workflow: Workflow = {
        ...BASE_WORKFLOW,
        scope: WORKFLOW_SCOPE.SEQUENCE,
      };

      const result = getConfiguredValues(BASE_CONFIGURED_INPUT, workflow);

      expect(result).toBeDefined();
    });
  });

  describe("type guards", () => {
    test("ASSEMBLY scope value passes isAssemblyConfiguredValue", () => {
      const workflow: Workflow = {
        ...BASE_WORKFLOW,
        scope: WORKFLOW_SCOPE.ASSEMBLY,
      };

      const configuredInput: ConfiguredInput = {
        ...BASE_CONFIGURED_INPUT,
        referenceAssembly: "GCF_000001405.40",
      };

      const result = getConfiguredValues(configuredInput, workflow);

      expect(result?._scope).toBe("ASSEMBLY");
      // Type guard would narrow to AssemblyConfiguredValue
      if (result && result._scope === "ASSEMBLY") {
        expect(result.referenceAssembly).toBe("GCF_000001405.40");
      }
    });

    test("ORGANISM scope value passes isOrganismConfiguredValue", () => {
      const workflow: Workflow = {
        ...BASE_WORKFLOW,
        scope: WORKFLOW_SCOPE.ORGANISM,
      };

      const result = getConfiguredValues(BASE_CONFIGURED_INPUT, workflow);

      expect(result?._scope).toBe("ORGANISM");
      // Type guard would narrow to OrganismConfiguredValue
      if (result && result._scope === "ORGANISM") {
        expect(result.fastaCollection).toBeNull();
      }
    });

    test("SEQUENCE scope value passes isSequenceConfiguredValue", () => {
      const workflow: Workflow = {
        ...BASE_WORKFLOW,
        scope: WORKFLOW_SCOPE.SEQUENCE,
      };

      const result = getConfiguredValues(BASE_CONFIGURED_INPUT, workflow);

      expect(result?._scope).toBe("SEQUENCE");
      // Type guard would narrow to SequenceConfiguredValue
      if (result && result._scope === "SEQUENCE") {
        expect(result.numberOfHits).toBe(10);
      }
    });
  });
});
