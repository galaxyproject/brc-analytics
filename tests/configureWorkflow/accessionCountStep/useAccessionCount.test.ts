import { act, renderHook } from "@testing-library/react";
import { ChangeEvent } from "react";
import { useAccessionCount } from "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/AccessionCountStep/hooks/UseAccessionCount/hook";
import { ConfiguredInput } from "../../../app/views/WorkflowInputsView/hooks/UseConfigureInputs/types";

/**
 * Creates a mock ChangeEvent for an input element.
 * @param value - The input value string.
 * @returns The mock change event.
 */
function createMockChangeEvent(value: string): ChangeEvent<HTMLInputElement> {
  return {
    target: { value },
  } as ChangeEvent<HTMLInputElement>;
}

describe("useAccessionCount", () => {
  describe("initialization", () => {
    test("defaults to 10 when numberOfHits is undefined", () => {
      const configuredInput: ConfiguredInput = {};
      const { result } = renderHook(() => useAccessionCount(configuredInput));

      expect(result.current.inputValue).toBe("10");
      expect(result.current.numberOfHits).toBe(10);
      expect(result.current.disabled).toBe(false);
    });

    test("uses existing numberOfHits from configuredInput", () => {
      const configuredInput: ConfiguredInput = { numberOfHits: 25 };
      const { result } = renderHook(() => useAccessionCount(configuredInput));

      expect(result.current.inputValue).toBe("25");
      expect(result.current.numberOfHits).toBe(25);
    });
  });

  describe("onChange", () => {
    test("updates inputValue on change", () => {
      const { result } = renderHook(() => useAccessionCount({}));

      act(() => {
        result.current.onChange(createMockChangeEvent("42"));
      });

      expect(result.current.inputValue).toBe("42");
      expect(result.current.numberOfHits).toBe(42);
    });

    test("allows empty string as intermediate value", () => {
      const { result } = renderHook(() => useAccessionCount({}));

      act(() => {
        result.current.onChange(createMockChangeEvent(""));
      });

      expect(result.current.inputValue).toBe("");
      expect(result.current.disabled).toBe(true);
    });

    test("allows partial input while editing", () => {
      const { result } = renderHook(() =>
        useAccessionCount({ numberOfHits: 12 })
      );

      // Delete last digit.
      act(() => {
        result.current.onChange(createMockChangeEvent("1"));
      });

      expect(result.current.inputValue).toBe("1");
      expect(result.current.numberOfHits).toBe(1);
      expect(result.current.disabled).toBe(false);

      // Delete remaining digit.
      act(() => {
        result.current.onChange(createMockChangeEvent(""));
      });

      expect(result.current.inputValue).toBe("");
      expect(result.current.disabled).toBe(true);

      // Type new value.
      act(() => {
        result.current.onChange(createMockChangeEvent("5"));
      });

      expect(result.current.inputValue).toBe("5");
      expect(result.current.numberOfHits).toBe(5);
      expect(result.current.disabled).toBe(false);
    });
  });

  describe("validation", () => {
    test("disabled is false for valid values", () => {
      const { result } = renderHook(() => useAccessionCount({}));

      act(() => {
        result.current.onChange(createMockChangeEvent("5"));
      });

      expect(result.current.disabled).toBe(false);
    });

    test("disabled is true for zero", () => {
      const { result } = renderHook(() => useAccessionCount({}));

      act(() => {
        result.current.onChange(createMockChangeEvent("0"));
      });

      expect(result.current.disabled).toBe(true);
    });

    test("disabled is true for negative values", () => {
      const { result } = renderHook(() => useAccessionCount({}));

      act(() => {
        result.current.onChange(createMockChangeEvent("-1"));
      });

      expect(result.current.disabled).toBe(true);
    });

    test("disabled is true for non-numeric input", () => {
      const { result } = renderHook(() => useAccessionCount({}));

      act(() => {
        result.current.onChange(createMockChangeEvent("abc"));
      });

      expect(result.current.disabled).toBe(true);
    });
  });
});
