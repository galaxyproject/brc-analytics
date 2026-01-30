import {
  selectPrimary,
  toggleCovariate,
} from "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/DESeq2FormulaStep/hooks/UseFormulaSelection/utils";
import { FormulaSelection } from "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/DESeq2FormulaStep/hooks/UseFormulaSelection/types";

describe("selectPrimary", () => {
  test("sets the primary column", () => {
    const prev: FormulaSelection = {
      covariates: new Set(),
      primary: null,
    };

    const result = selectPrimary("treatment")(prev);

    expect(result.primary).toBe("treatment");
  });

  test("replaces the previous primary", () => {
    const prev: FormulaSelection = {
      covariates: new Set(),
      primary: "condition",
    };

    const result = selectPrimary("treatment")(prev);

    expect(result.primary).toBe("treatment");
  });

  test("removes the column from covariates if present", () => {
    const prev: FormulaSelection = {
      covariates: new Set(["treatment", "batch"]),
      primary: null,
    };

    const result = selectPrimary("treatment")(prev);

    expect(result.primary).toBe("treatment");
    expect(result.covariates.has("treatment")).toBe(false);
    expect(result.covariates.has("batch")).toBe(true);
  });

  test("does not mutate the original selection", () => {
    const prev: FormulaSelection = {
      covariates: new Set(["treatment"]),
      primary: null,
    };

    selectPrimary("treatment")(prev);

    expect(prev.covariates.has("treatment")).toBe(true);
    expect(prev.primary).toBeNull();
  });

  test("preserves other covariates when removing selected column", () => {
    const prev: FormulaSelection = {
      covariates: new Set(["treatment", "batch", "age"]),
      primary: null,
    };

    const result = selectPrimary("treatment")(prev);

    expect(result.covariates.size).toBe(2);
    expect(result.covariates.has("batch")).toBe(true);
    expect(result.covariates.has("age")).toBe(true);
  });
});

describe("toggleCovariate", () => {
  test("adds column to covariates when not present", () => {
    const prev: FormulaSelection = {
      covariates: new Set(),
      primary: "treatment",
    };

    const result = toggleCovariate("batch")(prev);

    expect(result.covariates.has("batch")).toBe(true);
  });

  test("removes column from covariates when present", () => {
    const prev: FormulaSelection = {
      covariates: new Set(["batch"]),
      primary: "treatment",
    };

    const result = toggleCovariate("batch")(prev);

    expect(result.covariates.has("batch")).toBe(false);
  });

  test("preserves other covariates when toggling", () => {
    const prev: FormulaSelection = {
      covariates: new Set(["batch", "age"]),
      primary: "treatment",
    };

    const result = toggleCovariate("batch")(prev);

    expect(result.covariates.has("batch")).toBe(false);
    expect(result.covariates.has("age")).toBe(true);
  });

  test("preserves primary when toggling covariates", () => {
    const prev: FormulaSelection = {
      covariates: new Set(),
      primary: "treatment",
    };

    const result = toggleCovariate("batch")(prev);

    expect(result.primary).toBe("treatment");
  });

  test("does not mutate the original selection", () => {
    const prev: FormulaSelection = {
      covariates: new Set(["batch"]),
      primary: "treatment",
    };

    toggleCovariate("batch")(prev);

    expect(prev.covariates.has("batch")).toBe(true);
  });

  test("can toggle multiple times", () => {
    const initial: FormulaSelection = {
      covariates: new Set(),
      primary: "treatment",
    };

    const afterAdd = toggleCovariate("batch")(initial);
    expect(afterAdd.covariates.has("batch")).toBe(true);

    const afterRemove = toggleCovariate("batch")(afterAdd);
    expect(afterRemove.covariates.has("batch")).toBe(false);

    const afterAddAgain = toggleCovariate("batch")(afterRemove);
    expect(afterAddAgain.covariates.has("batch")).toBe(true);
  });
});
