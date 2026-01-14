import { generateFormula } from "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/DESeq2FormulaStep/hooks/UseFormulaSelection/utils";
import { COLUMN_TYPE } from "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SampleSheetClassificationStep/types";
import { FormulaColumn } from "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/DESeq2FormulaStep/hooks/UseFormulaSelection/types";

describe("generateFormula", () => {
  test("returns null when no primary is selected", () => {
    const columns: FormulaColumn[] = [
      { columnName: "treatment", columnType: COLUMN_TYPE.BIOLOGICAL_FACTOR },
    ];
    const selection = { covariates: new Set<string>(), primary: null };

    expect(generateFormula(columns, selection)).toBeNull();
  });

  test("returns formula with only primary when no covariates selected", () => {
    const columns: FormulaColumn[] = [
      { columnName: "treatment", columnType: COLUMN_TYPE.BIOLOGICAL_FACTOR },
    ];
    const selection = { covariates: new Set<string>(), primary: "treatment" };

    expect(generateFormula(columns, selection)).toBe("~ treatment");
  });

  test("includes covariates before primary", () => {
    const columns: FormulaColumn[] = [
      {
        columnName: "batch",
        columnType: COLUMN_TYPE.TECHNICAL_BLOCKING_FACTOR,
      },
      { columnName: "treatment", columnType: COLUMN_TYPE.BIOLOGICAL_FACTOR },
    ];
    const selection = {
      covariates: new Set(["batch"]),
      primary: "treatment",
    };

    expect(generateFormula(columns, selection)).toBe("~ batch + treatment");
  });

  test("orders formula: technical blocking → other covariates → biological factors → primary", () => {
    const columns: FormulaColumn[] = [
      { columnName: "age", columnType: COLUMN_TYPE.OTHER_COVARIATE },
      {
        columnName: "batch",
        columnType: COLUMN_TYPE.TECHNICAL_BLOCKING_FACTOR,
      },
      { columnName: "condition", columnType: COLUMN_TYPE.BIOLOGICAL_FACTOR },
      { columnName: "treatment", columnType: COLUMN_TYPE.BIOLOGICAL_FACTOR },
    ];
    const selection = {
      covariates: new Set(["condition", "age", "batch"]),
      primary: "treatment",
    };

    expect(generateFormula(columns, selection)).toBe(
      "~ batch + age + condition + treatment"
    );
  });

  test("handles multiple technical blocking factors", () => {
    const columns: FormulaColumn[] = [
      {
        columnName: "batch1",
        columnType: COLUMN_TYPE.TECHNICAL_BLOCKING_FACTOR,
      },
      {
        columnName: "batch2",
        columnType: COLUMN_TYPE.TECHNICAL_BLOCKING_FACTOR,
      },
      { columnName: "treatment", columnType: COLUMN_TYPE.BIOLOGICAL_FACTOR },
    ];
    const selection = {
      covariates: new Set(["batch1", "batch2"]),
      primary: "treatment",
    };

    const formula = generateFormula(columns, selection);
    expect(formula).toMatch(/^~ batch[12] \+ batch[12] \+ treatment$/);
    expect(formula).toContain("batch1");
    expect(formula).toContain("batch2");
  });

  test("handles multiple other covariates", () => {
    const columns: FormulaColumn[] = [
      { columnName: "age", columnType: COLUMN_TYPE.OTHER_COVARIATE },
      { columnName: "sex", columnType: COLUMN_TYPE.OTHER_COVARIATE },
      { columnName: "treatment", columnType: COLUMN_TYPE.BIOLOGICAL_FACTOR },
    ];
    const selection = {
      covariates: new Set(["age", "sex"]),
      primary: "treatment",
    };

    const formula = generateFormula(columns, selection);
    expect(formula).toContain("age");
    expect(formula).toContain("sex");
    expect(formula).toContain("treatment");
    expect(formula?.endsWith("+ treatment")).toBe(true);
  });

  test("handles multiple biological factors as covariates", () => {
    const columns: FormulaColumn[] = [
      { columnName: "condition", columnType: COLUMN_TYPE.BIOLOGICAL_FACTOR },
      { columnName: "genotype", columnType: COLUMN_TYPE.BIOLOGICAL_FACTOR },
      { columnName: "treatment", columnType: COLUMN_TYPE.BIOLOGICAL_FACTOR },
    ];
    const selection = {
      covariates: new Set(["condition", "genotype"]),
      primary: "treatment",
    };

    const formula = generateFormula(columns, selection);
    expect(formula).toContain("condition");
    expect(formula).toContain("genotype");
    expect(formula?.endsWith("+ treatment")).toBe(true);
  });

  test("ignores covariates not found in columns", () => {
    const columns: FormulaColumn[] = [
      { columnName: "treatment", columnType: COLUMN_TYPE.BIOLOGICAL_FACTOR },
    ];
    const selection = {
      covariates: new Set(["nonexistent"]),
      primary: "treatment",
    };

    expect(generateFormula(columns, selection)).toBe("~ treatment");
  });

  test("handles empty columns array with primary", () => {
    const columns: FormulaColumn[] = [];
    const selection = {
      covariates: new Set<string>(),
      primary: "treatment",
    };

    expect(generateFormula(columns, selection)).toBe("~ treatment");
  });

  test("handles all three covariate types in correct order", () => {
    const columns: FormulaColumn[] = [
      { columnName: "age", columnType: COLUMN_TYPE.OTHER_COVARIATE },
      {
        columnName: "batch",
        columnType: COLUMN_TYPE.TECHNICAL_BLOCKING_FACTOR,
      },
      { columnName: "condition", columnType: COLUMN_TYPE.BIOLOGICAL_FACTOR },
      { columnName: "sex", columnType: COLUMN_TYPE.OTHER_COVARIATE },
      { columnName: "lane", columnType: COLUMN_TYPE.TECHNICAL_BLOCKING_FACTOR },
      { columnName: "treatment", columnType: COLUMN_TYPE.BIOLOGICAL_FACTOR },
    ];
    const selection = {
      covariates: new Set(["age", "batch", "condition", "sex", "lane"]),
      primary: "treatment",
    };

    const formula = generateFormula(columns, selection);

    // Split the formula to verify ordering
    const parts = formula!.replace("~ ", "").split(" + ");

    // Last element should be primary
    expect(parts[parts.length - 1]).toBe("treatment");

    // Find indices
    const batchIdx = parts.indexOf("batch");
    const laneIdx = parts.indexOf("lane");
    const ageIdx = parts.indexOf("age");
    const sexIdx = parts.indexOf("sex");
    const conditionIdx = parts.indexOf("condition");

    // Technical blocking should come first
    expect(batchIdx).toBeLessThan(ageIdx);
    expect(laneIdx).toBeLessThan(ageIdx);

    // Other covariates should come before biological factors
    expect(ageIdx).toBeLessThan(conditionIdx);
    expect(sexIdx).toBeLessThan(conditionIdx);

    // Biological factors (covariates) should come before primary
    expect(conditionIdx).toBeLessThan(parts.length - 1);
  });
});
