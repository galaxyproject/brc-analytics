import { renderHook, act } from "@testing-library/react";
import { useColumnClassification } from "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SampleSheetClassificationStep/hooks/UseColumnClassification/hook";
import { COLUMN_TYPE } from "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SampleSheetClassificationStep/types";

describe("useColumnClassification", () => {
  describe("initialization", () => {
    test("initializes with empty object when sampleSheet is undefined", () => {
      const { result } = renderHook(() => useColumnClassification(undefined));

      expect(Object.keys(result.current.classifications).length).toBe(0);
    });

    test("initializes with empty object when sampleSheet is empty", () => {
      const { result } = renderHook(() => useColumnClassification([]));

      expect(Object.keys(result.current.classifications).length).toBe(0);
    });

    test("initializes classifications from column names", () => {
      const sampleSheet = [
        { forward: "f1.fastq", sample_id: "S1", treatment: "control" },
      ];

      const { result } = renderHook(() => useColumnClassification(sampleSheet));

      expect(Object.keys(result.current.classifications).length).toBe(3);
      expect(result.current.classifications.sample_id).toBeNull();
      expect(result.current.classifications.treatment).toBeNull();
      expect(result.current.classifications.forward).toBeNull();
    });

    test("all initial classifications are null", () => {
      const sampleSheet = [{ col1: "a", col2: "b", col3: "c", col4: "d" }];

      const { result } = renderHook(() => useColumnClassification(sampleSheet));

      Object.values(result.current.classifications).forEach((value) => {
        expect(value).toBeNull();
      });
    });
  });

  describe("onClassify", () => {
    test("updates classification for a specific column", () => {
      const sampleSheet = [{ sample_id: "S1", treatment: "control" }];

      const { result } = renderHook(() => useColumnClassification(sampleSheet));

      act(() => {
        result.current.onClassify("sample_id", COLUMN_TYPE.IDENTIFIER);
      });

      expect(result.current.classifications.sample_id).toBe(
        COLUMN_TYPE.IDENTIFIER
      );
      expect(result.current.classifications.treatment).toBeNull();
    });

    test("updates multiple classifications independently", () => {
      const sampleSheet = [
        { forward: "f1.fastq", sample_id: "S1", treatment: "control" },
      ];

      const { result } = renderHook(() => useColumnClassification(sampleSheet));

      act(() => {
        result.current.onClassify("sample_id", COLUMN_TYPE.IDENTIFIER);
      });
      act(() => {
        result.current.onClassify("treatment", COLUMN_TYPE.BIOLOGICAL_FACTOR);
      });
      act(() => {
        result.current.onClassify("forward", COLUMN_TYPE.FORWARD_FILE_URL);
      });

      expect(result.current.classifications.sample_id).toBe(
        COLUMN_TYPE.IDENTIFIER
      );
      expect(result.current.classifications.treatment).toBe(
        COLUMN_TYPE.BIOLOGICAL_FACTOR
      );
      expect(result.current.classifications.forward).toBe(
        COLUMN_TYPE.FORWARD_FILE_URL
      );
    });

    test("allows changing a classification to a different type", () => {
      const sampleSheet = [{ sample_id: "S1" }];

      const { result } = renderHook(() => useColumnClassification(sampleSheet));

      act(() => {
        result.current.onClassify("sample_id", COLUMN_TYPE.IDENTIFIER);
      });
      expect(result.current.classifications.sample_id).toBe(
        COLUMN_TYPE.IDENTIFIER
      );

      act(() => {
        result.current.onClassify("sample_id", COLUMN_TYPE.IGNORED);
      });
      expect(result.current.classifications.sample_id).toBe(
        COLUMN_TYPE.IGNORED
      );
    });
  });

  describe("validation", () => {
    test("returns invalid when all columns are unclassified", () => {
      const sampleSheet = [{ sample_id: "S1", treatment: "control" }];

      const { result } = renderHook(() => useColumnClassification(sampleSheet));

      expect(result.current.validation.valid).toBe(false);
      expect(result.current.validation.errors.length).toBeGreaterThan(0);
    });

    test("returns valid when all requirements are met", () => {
      const sampleSheet = [
        {
          forward: "f1.fastq",
          reverse: "r1.fastq",
          sample_id: "S1",
          treatment: "control",
        },
      ];

      const { result } = renderHook(() => useColumnClassification(sampleSheet));

      act(() => {
        result.current.onClassify("sample_id", COLUMN_TYPE.IDENTIFIER);
      });
      act(() => {
        result.current.onClassify("forward", COLUMN_TYPE.FORWARD_FILE_URL);
      });
      act(() => {
        result.current.onClassify("reverse", COLUMN_TYPE.REVERSE_FILE_URL);
      });
      act(() => {
        result.current.onClassify("treatment", COLUMN_TYPE.BIOLOGICAL_FACTOR);
      });

      expect(result.current.validation.valid).toBe(true);
      expect(result.current.validation.errors).toEqual([]);
    });

    test("validation updates when classifications change", () => {
      const sampleSheet = [
        {
          forward: "f1.fastq",
          reverse: "r1.fastq",
          sample_id: "S1",
          treatment: "control",
        },
      ];

      const { result } = renderHook(() => useColumnClassification(sampleSheet));

      // Initially invalid
      expect(result.current.validation.valid).toBe(false);

      // Partially classify
      act(() => {
        result.current.onClassify("sample_id", COLUMN_TYPE.IDENTIFIER);
      });
      expect(result.current.validation.valid).toBe(false);

      // Fully classify
      act(() => {
        result.current.onClassify("forward", COLUMN_TYPE.FORWARD_FILE_URL);
      });
      act(() => {
        result.current.onClassify("reverse", COLUMN_TYPE.REVERSE_FILE_URL);
      });
      act(() => {
        result.current.onClassify("treatment", COLUMN_TYPE.BIOLOGICAL_FACTOR);
      });

      expect(result.current.validation.valid).toBe(true);
    });
  });

  describe("sampleSheet changes", () => {
    test("reinitializes classifications when sampleSheet changes", () => {
      const initialSampleSheet: Record<string, string>[] = [
        { col1: "a", col2: "b" },
      ];
      const newSampleSheet: Record<string, string>[] = [
        { col3: "c", col4: "d", col5: "e" },
      ];

      const { rerender, result } = renderHook(
        (props: { sampleSheet: Record<string, string>[] }) =>
          useColumnClassification(props.sampleSheet),
        { initialProps: { sampleSheet: initialSampleSheet } }
      );

      // Initially has 2 columns
      expect(Object.keys(result.current.classifications).length).toBe(2);
      expect("col1" in result.current.classifications).toBe(true);
      expect("col2" in result.current.classifications).toBe(true);

      // Classify a column
      act(() => {
        result.current.onClassify("col1", COLUMN_TYPE.IDENTIFIER);
      });
      expect(result.current.classifications.col1).toBe(COLUMN_TYPE.IDENTIFIER);

      // Change sample sheet
      rerender({ sampleSheet: newSampleSheet });

      // Should have new columns, all null
      expect(Object.keys(result.current.classifications).length).toBe(3);
      expect("col3" in result.current.classifications).toBe(true);
      expect("col4" in result.current.classifications).toBe(true);
      expect("col5" in result.current.classifications).toBe(true);
      expect(result.current.classifications.col3).toBeNull();
      expect(result.current.classifications.col4).toBeNull();
      expect(result.current.classifications.col5).toBeNull();
    });
  });
});
