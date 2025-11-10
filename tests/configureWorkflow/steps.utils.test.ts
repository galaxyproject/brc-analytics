// Mock STEP import to avoid pulling in unneeded UI step modules.
jest.mock(
  "../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/steps/constants",
  (): Record<string, unknown> => ({
    STEP: {},
  })
);

import { augmentConfiguredSteps } from "../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/steps/utils";
import type { ConfiguredInput } from "../../app/views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import type { StepConfig } from "../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/types";

const SEQUENCING_STEPS: Record<string, StepConfig> = {
  readRunsPaired: { key: "readRunsPaired" } as StepConfig,
  readRunsSingle: { key: "readRunsSingle" } as StepConfig,
};

describe("augmentConfiguredSteps", () => {
  test("returns configured steps unchanged when no read run selections", () => {
    const configuredSteps: StepConfig[] = [];
    const configuredInput: ConfiguredInput = {};
    expect(
      augmentConfiguredSteps(
        configuredSteps,
        configuredInput,
        SEQUENCING_STEPS
      ).map((s) => s.key)
    ).toEqual([]);
  });

  test("adds SINGLE step when readRunsSingle is an empty array (user upload)", () => {
    const configuredSteps: StepConfig[] = [];
    const configuredInput: ConfiguredInput = { readRunsSingle: [] };
    expect(
      augmentConfiguredSteps(
        configuredSteps,
        configuredInput,
        SEQUENCING_STEPS
      ).map((s) => s.key)
    ).toEqual(["readRunsSingle"]);
  });

  test("adds PAIRED and SINGLE steps when both selections exist", () => {
    const configuredSteps: StepConfig[] = [];
    const configuredInput: ConfiguredInput = {
      readRunsPaired: [],
      readRunsSingle: [],
    };
    expect(
      augmentConfiguredSteps(
        configuredSteps,
        configuredInput,
        SEQUENCING_STEPS
      ).map((s) => s.key)
    ).toEqual(["readRunsPaired", "readRunsSingle"]);
  });

  test("does not add duplicate step when it already exists, but adds the missing one", () => {
    const configuredSteps: StepConfig[] = [
      { key: "readRunsPaired" } as StepConfig,
    ];
    const configuredInput: ConfiguredInput = {
      readRunsPaired: [],
      readRunsSingle: [],
    };
    expect(
      augmentConfiguredSteps(
        configuredSteps,
        configuredInput,
        SEQUENCING_STEPS
      ).map((s) => s.key)
    ).toEqual(["readRunsPaired", "readRunsSingle"]);
  });

  test("does not add steps for null or undefined values", () => {
    const configuredSteps: StepConfig[] = [];
    const configuredInput: ConfiguredInput = {
      readRunsPaired: null,
      readRunsSingle: undefined,
    } as ConfiguredInput;
    expect(
      augmentConfiguredSteps(
        configuredSteps,
        configuredInput,
        SEQUENCING_STEPS
      ).map((s) => s.key)
    ).toEqual([]);
  });
});
