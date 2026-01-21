import { renderHook } from "@testing-library/react";
import { usePrimaryContrasts } from "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/PrimaryContrastsStep/hooks/UsePrimaryContrasts/hook";
import { UseBaselineContrasts } from "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/PrimaryContrastsStep/hooks/UseBaselineContrasts/types";
import { UseExplicitContrasts } from "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/PrimaryContrastsStep/hooks/UseExplicitContrasts/types";
import { CONTRAST_MODE } from "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/PrimaryContrastsStep/hooks/UseRadioGroup/types";

const FACTOR_VALUES_COUNT = 2;

const createMockBaselineContrasts = (
  overrides: Partial<UseBaselineContrasts> = {}
): UseBaselineContrasts => ({
  baseline: null,
  compare: new Set(),
  onSelectBaseline: jest.fn(),
  onToggleCompare: jest.fn(),
  primaryContrasts: null,
  valid: false,
  ...overrides,
});

const createMockExplicitContrasts = (
  overrides: Partial<UseExplicitContrasts> = {}
): UseExplicitContrasts => ({
  onAddPair: jest.fn(),
  onRemovePair: jest.fn(),
  onUpdatePair: jest.fn(),
  pairs: new Map(),
  primaryContrasts: null,
  valid: false,
  ...overrides,
});

describe("usePrimaryContrasts", () => {
  describe("disabled", () => {
    test("returns false for ALL_AGAINST_ALL mode", () => {
      const { result } = renderHook(() =>
        usePrimaryContrasts(
          CONTRAST_MODE.ALL_AGAINST_ALL,
          createMockBaselineContrasts(),
          createMockExplicitContrasts(),
          FACTOR_VALUES_COUNT
        )
      );

      expect(result.current.disabled).toBe(false);
    });

    test("returns true for BASELINE mode when invalid", () => {
      const { result } = renderHook(() =>
        usePrimaryContrasts(
          CONTRAST_MODE.BASELINE,
          createMockBaselineContrasts({ valid: false }),
          createMockExplicitContrasts(),
          FACTOR_VALUES_COUNT
        )
      );

      expect(result.current.disabled).toBe(true);
    });

    test("returns false for BASELINE mode when valid", () => {
      const { result } = renderHook(() =>
        usePrimaryContrasts(
          CONTRAST_MODE.BASELINE,
          createMockBaselineContrasts({ valid: true }),
          createMockExplicitContrasts(),
          FACTOR_VALUES_COUNT
        )
      );

      expect(result.current.disabled).toBe(false);
    });

    test("returns true for EXPLICIT mode when invalid", () => {
      const { result } = renderHook(() =>
        usePrimaryContrasts(
          CONTRAST_MODE.EXPLICIT,
          createMockBaselineContrasts(),
          createMockExplicitContrasts({ valid: false }),
          FACTOR_VALUES_COUNT
        )
      );

      expect(result.current.disabled).toBe(true);
    });

    test("returns false for EXPLICIT mode when valid", () => {
      const { result } = renderHook(() =>
        usePrimaryContrasts(
          CONTRAST_MODE.EXPLICIT,
          createMockBaselineContrasts(),
          createMockExplicitContrasts({ valid: true }),
          FACTOR_VALUES_COUNT
        )
      );

      expect(result.current.disabled).toBe(false);
    });
  });

  describe("primaryContrasts", () => {
    test("returns ALL_AGAINST_ALL type for ALL_AGAINST_ALL mode", () => {
      const { result } = renderHook(() =>
        usePrimaryContrasts(
          CONTRAST_MODE.ALL_AGAINST_ALL,
          createMockBaselineContrasts(),
          createMockExplicitContrasts(),
          FACTOR_VALUES_COUNT
        )
      );

      expect(result.current.primaryContrasts).toEqual({
        type: "ALL_AGAINST_ALL",
      });
    });

    test("returns baseline contrasts for BASELINE mode", () => {
      const baselineContrasts = {
        baseline: "control",
        compare: ["treated", "experimental"],
        type: "BASELINE" as const,
      };

      const { result } = renderHook(() =>
        usePrimaryContrasts(
          CONTRAST_MODE.BASELINE,
          createMockBaselineContrasts({ primaryContrasts: baselineContrasts }),
          createMockExplicitContrasts(),
          FACTOR_VALUES_COUNT
        )
      );

      expect(result.current.primaryContrasts).toEqual(baselineContrasts);
    });

    test("returns null for BASELINE mode when not configured", () => {
      const { result } = renderHook(() =>
        usePrimaryContrasts(
          CONTRAST_MODE.BASELINE,
          createMockBaselineContrasts({ primaryContrasts: null }),
          createMockExplicitContrasts(),
          FACTOR_VALUES_COUNT
        )
      );

      expect(result.current.primaryContrasts).toBeNull();
    });

    test("returns explicit contrasts for EXPLICIT mode", () => {
      const explicitContrasts = {
        pairs: [["control", "treated"]] as [string, string][],
        type: "EXPLICIT" as const,
      };

      const { result } = renderHook(() =>
        usePrimaryContrasts(
          CONTRAST_MODE.EXPLICIT,
          createMockBaselineContrasts(),
          createMockExplicitContrasts({ primaryContrasts: explicitContrasts }),
          FACTOR_VALUES_COUNT
        )
      );

      expect(result.current.primaryContrasts).toEqual(explicitContrasts);
    });

    test("returns null for EXPLICIT mode when not configured", () => {
      const { result } = renderHook(() =>
        usePrimaryContrasts(
          CONTRAST_MODE.EXPLICIT,
          createMockBaselineContrasts(),
          createMockExplicitContrasts({ primaryContrasts: null }),
          FACTOR_VALUES_COUNT
        )
      );

      expect(result.current.primaryContrasts).toBeNull();
    });
  });

  describe("mode changes", () => {
    test("updates disabled when mode changes", () => {
      const baselineContrasts = createMockBaselineContrasts({ valid: true });
      const explicitContrasts = createMockExplicitContrasts({ valid: false });

      const { rerender, result } = renderHook(
        ({ mode }) =>
          usePrimaryContrasts(
            mode,
            baselineContrasts,
            explicitContrasts,
            FACTOR_VALUES_COUNT
          ),
        { initialProps: { mode: CONTRAST_MODE.BASELINE } }
      );

      expect(result.current.disabled).toBe(false);

      rerender({ mode: CONTRAST_MODE.EXPLICIT });

      expect(result.current.disabled).toBe(true);
    });

    test("updates primaryContrasts when mode changes", () => {
      const baselinePC = {
        baseline: "control",
        compare: ["treated"],
        type: "BASELINE" as const,
      };
      const explicitPC = {
        pairs: [["a", "b"]] as [string, string][],
        type: "EXPLICIT" as const,
      };

      const baselineContrasts = createMockBaselineContrasts({
        primaryContrasts: baselinePC,
      });
      const explicitContrasts = createMockExplicitContrasts({
        primaryContrasts: explicitPC,
      });

      const { rerender, result } = renderHook(
        ({ mode }) =>
          usePrimaryContrasts(
            mode,
            baselineContrasts,
            explicitContrasts,
            FACTOR_VALUES_COUNT
          ),
        { initialProps: { mode: CONTRAST_MODE.BASELINE } }
      );

      expect(result.current.primaryContrasts).toEqual(baselinePC);

      rerender({ mode: CONTRAST_MODE.EXPLICIT });

      expect(result.current.primaryContrasts).toEqual(explicitPC);

      rerender({ mode: CONTRAST_MODE.ALL_AGAINST_ALL });

      expect(result.current.primaryContrasts).toEqual({
        type: "ALL_AGAINST_ALL",
      });
    });
  });
});
