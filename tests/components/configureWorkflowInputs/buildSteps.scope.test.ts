// Mock STEP import to avoid pulling in unneeded UI step modules.
jest.mock(
  "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/steps/constants",
  (): Record<string, unknown> => ({
    STEP: {
      ASSEMBLY_ID: { key: "ASSEMBLY_ID" },
      GENE_MODEL_URL: { key: "GENE_MODEL_URL" },
      SANGER_READ_RUN_PAIRED: { key: "SANGER_READ_RUN_PAIRED" },
      SANGER_READ_RUN_SINGLE: { key: "SANGER_READ_RUN_SINGLE" },
    },
  })
);

import { buildSteps } from "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/steps/utils";
import type { Workflow } from "../../../app/apis/catalog/brc-analytics-catalog/common/entities";
import {
  WORKFLOW_PARAMETER_VARIABLE,
  WORKFLOW_PLOIDY,
  WORKFLOW_SCOPE,
} from "../../../app/apis/catalog/brc-analytics-catalog/common/schema-entities";

describe("buildSteps - scope handling", () => {
  const BASE_WORKFLOW: Workflow = {
    iwcId: "iwc-test",
    parameters: [
      {
        key: "Reference genome",
        variable: WORKFLOW_PARAMETER_VARIABLE.ASSEMBLY_FASTA_URL,
      },
    ],
    ploidy: WORKFLOW_PLOIDY.ANY,
    taxonomyId: null,
    trsId: "#trs-test",
    workflowDescription: "test workflow",
    workflowName: "Test Workflow",
  };

  describe("ASSEMBLY scope", () => {
    test("includes ASSEMBLY_ID step for ASSEMBLY scope workflow", () => {
      const workflow: Workflow = {
        ...BASE_WORKFLOW,
        scope: WORKFLOW_SCOPE.ASSEMBLY,
      };

      const steps = buildSteps(workflow);

      expect(steps.map((s) => s.key)).toContain("ASSEMBLY_ID");
    });

    test("includes ASSEMBLY_ID step when scope is undefined (defaults to ASSEMBLY)", () => {
      const workflow: Workflow = {
        ...BASE_WORKFLOW,
        scope: undefined,
      };

      const steps = buildSteps(workflow);

      expect(steps.map((s) => s.key)).toContain("ASSEMBLY_ID");
    });

    test("includes ASSEMBLY_ID and other workflow parameters", () => {
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

      const steps = buildSteps(workflow);

      expect(steps.map((s) => s.key)).toEqual([
        "ASSEMBLY_ID",
        "GENE_MODEL_URL",
      ]);
    });

    test("includes ASSEMBLY_ID even if workflow has no other parameters", () => {
      const workflow: Workflow = {
        ...BASE_WORKFLOW,
        parameters: [],
        scope: WORKFLOW_SCOPE.ASSEMBLY,
      };

      const steps = buildSteps(workflow);

      expect(steps.map((s) => s.key)).toEqual(["ASSEMBLY_ID"]);
    });
  });

  describe("ORGANISM scope", () => {
    test("returns empty array for ORGANISM scope workflow", () => {
      const workflow: Workflow = {
        ...BASE_WORKFLOW,
        scope: WORKFLOW_SCOPE.ORGANISM,
      };

      // Suppress console.warn for this test
      const warnSpy = jest.spyOn(console, "warn").mockImplementation();

      const steps = buildSteps(workflow);

      expect(steps).toEqual([]);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("ORGANISM scope workflows not yet implemented")
      );

      warnSpy.mockRestore();
    });

    test("logs warning with workflow name for ORGANISM scope", () => {
      const workflow: Workflow = {
        ...BASE_WORKFLOW,
        scope: WORKFLOW_SCOPE.ORGANISM,
        workflowName: "My Organism Workflow",
      };

      const warnSpy = jest.spyOn(console, "warn").mockImplementation();

      buildSteps(workflow);

      expect(warnSpy).toHaveBeenCalledWith(
        "ORGANISM scope workflows not yet implemented for workflow: My Organism Workflow"
      );

      warnSpy.mockRestore();
    });
  });

  describe("SEQUENCE scope", () => {
    test("returns empty array for SEQUENCE scope workflow", () => {
      const workflow: Workflow = {
        ...BASE_WORKFLOW,
        scope: WORKFLOW_SCOPE.SEQUENCE,
      };

      const warnSpy = jest.spyOn(console, "warn").mockImplementation();

      const steps = buildSteps(workflow);

      expect(steps).toEqual([]);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("SEQUENCE scope workflows not yet implemented")
      );

      warnSpy.mockRestore();
    });

    test("logs warning with workflow name for SEQUENCE scope", () => {
      const workflow: Workflow = {
        ...BASE_WORKFLOW,
        scope: WORKFLOW_SCOPE.SEQUENCE,
        workflowName: "My Sequence Workflow",
      };

      const warnSpy = jest.spyOn(console, "warn").mockImplementation();

      buildSteps(workflow);

      expect(warnSpy).toHaveBeenCalledWith(
        "SEQUENCE scope workflows not yet implemented for workflow: My Sequence Workflow"
      );

      warnSpy.mockRestore();
    });
  });

  describe("edge cases", () => {
    test("handles workflow with sequencing parameters", () => {
      const workflow: Workflow = {
        ...BASE_WORKFLOW,
        parameters: [
          {
            key: "Single reads",
            variable: WORKFLOW_PARAMETER_VARIABLE.SANGER_READ_RUN_SINGLE,
          },
          {
            key: "Paired reads",
            variable: WORKFLOW_PARAMETER_VARIABLE.SANGER_READ_RUN_PAIRED,
          },
        ],
        scope: WORKFLOW_SCOPE.ASSEMBLY,
      };

      const steps = buildSteps(workflow);

      expect(steps.map((s) => s.key)).toEqual([
        "ASSEMBLY_ID",
        "SANGER_READ_RUN_SINGLE",
        "SANGER_READ_RUN_PAIRED",
      ]);
    });

    test("handles workflow with all parameter types", () => {
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
          {
            key: "Single reads",
            variable: WORKFLOW_PARAMETER_VARIABLE.SANGER_READ_RUN_SINGLE,
          },
          {
            key: "Paired reads",
            variable: WORKFLOW_PARAMETER_VARIABLE.SANGER_READ_RUN_PAIRED,
          },
        ],
        scope: WORKFLOW_SCOPE.ASSEMBLY,
      };

      const steps = buildSteps(workflow);

      expect(steps.map((s) => s.key)).toEqual([
        "ASSEMBLY_ID",
        "GENE_MODEL_URL",
        "SANGER_READ_RUN_SINGLE",
        "SANGER_READ_RUN_PAIRED",
      ]);
    });
  });
});
