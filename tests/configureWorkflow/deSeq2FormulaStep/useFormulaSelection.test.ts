import { renderHook, act } from "@testing-library/react";
import { useFormulaSelection } from "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/DESeq2FormulaStep/hooks/UseFormulaSelection/hook";
import { COLUMN_TYPE } from "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SampleSheetClassificationStep/types";

describe("useFormulaSelection", () => {
  describe("column filtering", () => {
    test("returns empty array when sampleSheetClassification is undefined", () => {
      const { result } = renderHook(() => useFormulaSelection(undefined));

      expect(result.current.columns).toEqual([]);
    });

    test("filters out columns with null classification", () => {
      const sampleSheetClassification: Record<string, COLUMN_TYPE | null> = {
        batch: COLUMN_TYPE.TECHNICAL_BLOCKING_FACTOR,
        sample_id: COLUMN_TYPE.IDENTIFIER,
        treatment: null,
      };

      const { result } = renderHook(() =>
        useFormulaSelection(sampleSheetClassification)
      );

      expect(result.current.columns).toHaveLength(1);
      expect(result.current.columns[0].columnName).toBe("batch");
    });

    test("filters out non-formula column types", () => {
      const sampleSheetClassification: Record<string, COLUMN_TYPE | null> = {
        forward: COLUMN_TYPE.FORWARD_FILE_PATH,
        notes: COLUMN_TYPE.IGNORED,
        qc_metric: COLUMN_TYPE.QC_ONLY,
        reverse: COLUMN_TYPE.REVERSE_FILE_PATH,
        sample_id: COLUMN_TYPE.IDENTIFIER,
        treatment: COLUMN_TYPE.BIOLOGICAL_FACTOR,
      };

      const { result } = renderHook(() =>
        useFormulaSelection(sampleSheetClassification)
      );

      expect(result.current.columns).toHaveLength(1);
      expect(result.current.columns[0].columnName).toBe("treatment");
      expect(result.current.columns[0].columnType).toBe(
        COLUMN_TYPE.BIOLOGICAL_FACTOR
      );
    });

    test("includes only BIOLOGICAL_FACTOR, TECHNICAL_BLOCKING_FACTOR, and OTHER_COVARIATE", () => {
      const sampleSheetClassification: Record<string, COLUMN_TYPE | null> = {
        age: COLUMN_TYPE.OTHER_COVARIATE,
        batch: COLUMN_TYPE.TECHNICAL_BLOCKING_FACTOR,
        treatment: COLUMN_TYPE.BIOLOGICAL_FACTOR,
      };

      const { result } = renderHook(() =>
        useFormulaSelection(sampleSheetClassification)
      );

      expect(result.current.columns).toHaveLength(3);
      const columnNames = result.current.columns.map((c) => c.columnName);
      expect(columnNames).toContain("treatment");
      expect(columnNames).toContain("batch");
      expect(columnNames).toContain("age");
    });
  });

  describe("primary selection", () => {
    test("onSelectPrimary sets the primary column", () => {
      const sampleSheetClassification: Record<string, COLUMN_TYPE | null> = {
        batch: COLUMN_TYPE.TECHNICAL_BLOCKING_FACTOR,
        treatment: COLUMN_TYPE.BIOLOGICAL_FACTOR,
      };

      const { result } = renderHook(() =>
        useFormulaSelection(sampleSheetClassification)
      );

      expect(result.current.selection.primary).toBeNull();

      act(() => {
        result.current.onSelectPrimary("treatment");
      });

      expect(result.current.selection.primary).toBe("treatment");
    });

    test("selecting a new primary replaces the previous one", () => {
      const sampleSheetClassification: Record<string, COLUMN_TYPE | null> = {
        condition: COLUMN_TYPE.BIOLOGICAL_FACTOR,
        treatment: COLUMN_TYPE.BIOLOGICAL_FACTOR,
      };

      const { result } = renderHook(() =>
        useFormulaSelection(sampleSheetClassification)
      );

      act(() => {
        result.current.onSelectPrimary("treatment");
      });
      expect(result.current.selection.primary).toBe("treatment");

      act(() => {
        result.current.onSelectPrimary("condition");
      });
      expect(result.current.selection.primary).toBe("condition");
    });

    test("selecting a column as primary removes it from covariates", () => {
      const sampleSheetClassification: Record<string, COLUMN_TYPE | null> = {
        condition: COLUMN_TYPE.BIOLOGICAL_FACTOR,
        treatment: COLUMN_TYPE.BIOLOGICAL_FACTOR,
      };

      const { result } = renderHook(() =>
        useFormulaSelection(sampleSheetClassification)
      );

      // First add treatment as a covariate
      act(() => {
        result.current.onToggleCovariate("treatment");
      });
      expect(result.current.selection.covariates.has("treatment")).toBe(true);

      // Then select treatment as primary
      act(() => {
        result.current.onSelectPrimary("treatment");
      });

      expect(result.current.selection.primary).toBe("treatment");
      expect(result.current.selection.covariates.has("treatment")).toBe(false);
    });
  });

  describe("covariate toggling", () => {
    test("onToggleCovariate adds column to covariates set", () => {
      const sampleSheetClassification: Record<string, COLUMN_TYPE | null> = {
        batch: COLUMN_TYPE.TECHNICAL_BLOCKING_FACTOR,
        treatment: COLUMN_TYPE.BIOLOGICAL_FACTOR,
      };

      const { result } = renderHook(() =>
        useFormulaSelection(sampleSheetClassification)
      );

      expect(result.current.selection.covariates.size).toBe(0);

      act(() => {
        result.current.onToggleCovariate("batch");
      });

      expect(result.current.selection.covariates.has("batch")).toBe(true);
    });

    test("toggling an existing covariate removes it", () => {
      const sampleSheetClassification: Record<string, COLUMN_TYPE | null> = {
        batch: COLUMN_TYPE.TECHNICAL_BLOCKING_FACTOR,
        treatment: COLUMN_TYPE.BIOLOGICAL_FACTOR,
      };

      const { result } = renderHook(() =>
        useFormulaSelection(sampleSheetClassification)
      );

      act(() => {
        result.current.onToggleCovariate("batch");
      });
      expect(result.current.selection.covariates.has("batch")).toBe(true);

      act(() => {
        result.current.onToggleCovariate("batch");
      });
      expect(result.current.selection.covariates.has("batch")).toBe(false);
    });

    test("can add multiple covariates", () => {
      const sampleSheetClassification: Record<string, COLUMN_TYPE | null> = {
        age: COLUMN_TYPE.OTHER_COVARIATE,
        batch: COLUMN_TYPE.TECHNICAL_BLOCKING_FACTOR,
        treatment: COLUMN_TYPE.BIOLOGICAL_FACTOR,
      };

      const { result } = renderHook(() =>
        useFormulaSelection(sampleSheetClassification)
      );

      act(() => {
        result.current.onToggleCovariate("batch");
      });
      act(() => {
        result.current.onToggleCovariate("age");
      });

      expect(result.current.selection.covariates.size).toBe(2);
      expect(result.current.selection.covariates.has("batch")).toBe(true);
      expect(result.current.selection.covariates.has("age")).toBe(true);
    });
  });

  describe("formula generation", () => {
    test("returns null when no primary is selected", () => {
      const sampleSheetClassification: Record<string, COLUMN_TYPE | null> = {
        batch: COLUMN_TYPE.TECHNICAL_BLOCKING_FACTOR,
        treatment: COLUMN_TYPE.BIOLOGICAL_FACTOR,
      };

      const { result } = renderHook(() =>
        useFormulaSelection(sampleSheetClassification)
      );

      expect(result.current.formula).toBeNull();
    });

    test("returns formula with only primary when no covariates selected", () => {
      const sampleSheetClassification: Record<string, COLUMN_TYPE | null> = {
        treatment: COLUMN_TYPE.BIOLOGICAL_FACTOR,
      };

      const { result } = renderHook(() =>
        useFormulaSelection(sampleSheetClassification)
      );

      act(() => {
        result.current.onSelectPrimary("treatment");
      });

      expect(result.current.formula).toBe("~ treatment");
    });

    test("orders formula: technical blocking → other covariates → biological factors → primary", () => {
      const sampleSheetClassification: Record<string, COLUMN_TYPE | null> = {
        age: COLUMN_TYPE.OTHER_COVARIATE,
        batch: COLUMN_TYPE.TECHNICAL_BLOCKING_FACTOR,
        condition: COLUMN_TYPE.BIOLOGICAL_FACTOR,
        treatment: COLUMN_TYPE.BIOLOGICAL_FACTOR,
      };

      const { result } = renderHook(() =>
        useFormulaSelection(sampleSheetClassification)
      );

      // Select treatment as primary
      act(() => {
        result.current.onSelectPrimary("treatment");
      });

      // Add covariates in random order
      act(() => {
        result.current.onToggleCovariate("condition"); // biological factor
      });
      act(() => {
        result.current.onToggleCovariate("age"); // other covariate
      });
      act(() => {
        result.current.onToggleCovariate("batch"); // technical blocking
      });

      // Formula should be ordered: batch (technical) + age (other) + condition (biological) + treatment (primary)
      expect(result.current.formula).toBe(
        "~ batch + age + condition + treatment"
      );
    });

    test("generates correct formula with multiple covariates of same type", () => {
      const sampleSheetClassification: Record<string, COLUMN_TYPE | null> = {
        batch1: COLUMN_TYPE.TECHNICAL_BLOCKING_FACTOR,
        batch2: COLUMN_TYPE.TECHNICAL_BLOCKING_FACTOR,
        treatment: COLUMN_TYPE.BIOLOGICAL_FACTOR,
      };

      const { result } = renderHook(() =>
        useFormulaSelection(sampleSheetClassification)
      );

      act(() => {
        result.current.onSelectPrimary("treatment");
      });
      act(() => {
        result.current.onToggleCovariate("batch1");
      });
      act(() => {
        result.current.onToggleCovariate("batch2");
      });

      // Both technical blocking factors should appear before the primary
      expect(result.current.formula).toMatch(
        /^~ batch[12] \+ batch[12] \+ treatment$/
      );
      expect(result.current.formula).toContain("batch1");
      expect(result.current.formula).toContain("batch2");
    });
  });

  describe("validation", () => {
    test("valid is false when no primary is selected", () => {
      const sampleSheetClassification: Record<string, COLUMN_TYPE | null> = {
        treatment: COLUMN_TYPE.BIOLOGICAL_FACTOR,
      };

      const { result } = renderHook(() =>
        useFormulaSelection(sampleSheetClassification)
      );

      expect(result.current.valid).toBe(false);
    });

    test("valid is true when primary is selected", () => {
      const sampleSheetClassification: Record<string, COLUMN_TYPE | null> = {
        treatment: COLUMN_TYPE.BIOLOGICAL_FACTOR,
      };

      const { result } = renderHook(() =>
        useFormulaSelection(sampleSheetClassification)
      );

      act(() => {
        result.current.onSelectPrimary("treatment");
      });

      expect(result.current.valid).toBe(true);
    });

    test("valid remains true with covariates added", () => {
      const sampleSheetClassification: Record<string, COLUMN_TYPE | null> = {
        batch: COLUMN_TYPE.TECHNICAL_BLOCKING_FACTOR,
        treatment: COLUMN_TYPE.BIOLOGICAL_FACTOR,
      };

      const { result } = renderHook(() =>
        useFormulaSelection(sampleSheetClassification)
      );

      act(() => {
        result.current.onSelectPrimary("treatment");
      });
      act(() => {
        result.current.onToggleCovariate("batch");
      });

      expect(result.current.valid).toBe(true);
    });

    test("valid is true even with only covariates and no columns left for primary (edge case)", () => {
      // This tests that validation only checks for primary selection,
      // not that there are remaining columns
      const sampleSheetClassification: Record<string, COLUMN_TYPE | null> = {
        treatment: COLUMN_TYPE.BIOLOGICAL_FACTOR,
      };

      const { result } = renderHook(() =>
        useFormulaSelection(sampleSheetClassification)
      );

      act(() => {
        result.current.onSelectPrimary("treatment");
      });

      expect(result.current.valid).toBe(true);
    });
  });
});
