import { act, renderHook } from "@testing-library/react";
import { useBaselineContrasts } from "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/PrimaryContrastsStep/hooks/UseBaselineContrasts/hook";
import {
  buildBaselineContrasts,
  createInitialCompare,
  removeFromCompareUpdater,
  selectBaselineUpdater,
  toggleCompareUpdater,
  validateBaselineContrasts,
} from "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/PrimaryContrastsStep/hooks/UseBaselineContrasts/utils";

describe("useBaselineContrasts", () => {
  describe("initialization", () => {
    test("initializes with null baseline", () => {
      const { result } = renderHook(() => useBaselineContrasts("condition"));

      expect(result.current.baseline).toBeNull();
    });

    test("initializes with empty compare set", () => {
      const { result } = renderHook(() => useBaselineContrasts("condition"));

      expect(result.current.compare.size).toBe(0);
    });

    test("initializes with valid as false", () => {
      const { result } = renderHook(() => useBaselineContrasts("condition"));

      expect(result.current.valid).toBe(false);
    });
  });

  describe("onSelectBaseline", () => {
    test("selects baseline value", () => {
      const { result } = renderHook(() => useBaselineContrasts("condition"));

      act(() => {
        result.current.onSelectBaseline("control");
      });

      expect(result.current.baseline).toBe("control");
    });

    test("changes baseline value", () => {
      const { result } = renderHook(() => useBaselineContrasts("condition"));

      act(() => {
        result.current.onSelectBaseline("control");
      });
      act(() => {
        result.current.onSelectBaseline("treated");
      });

      expect(result.current.baseline).toBe("treated");
    });

    test("removes new baseline from compare set", () => {
      const { result } = renderHook(() => useBaselineContrasts("condition"));

      act(() => {
        result.current.onToggleCompare("control");
      });
      act(() => {
        result.current.onToggleCompare("treated");
      });

      expect(result.current.compare.has("control")).toBe(true);
      expect(result.current.compare.has("treated")).toBe(true);

      act(() => {
        result.current.onSelectBaseline("control");
      });

      expect(result.current.compare.has("control")).toBe(false);
      expect(result.current.compare.has("treated")).toBe(true);
    });
  });

  describe("onToggleCompare", () => {
    test("adds value to compare set", () => {
      const { result } = renderHook(() => useBaselineContrasts("condition"));

      act(() => {
        result.current.onToggleCompare("treated");
      });

      expect(result.current.compare.has("treated")).toBe(true);
    });

    test("removes value from compare set when toggled twice", () => {
      const { result } = renderHook(() => useBaselineContrasts("condition"));

      act(() => {
        result.current.onToggleCompare("treated");
      });
      act(() => {
        result.current.onToggleCompare("treated");
      });

      expect(result.current.compare.has("treated")).toBe(false);
    });

    test("adds multiple values to compare set", () => {
      const { result } = renderHook(() => useBaselineContrasts("condition"));

      act(() => {
        result.current.onToggleCompare("treated");
      });
      act(() => {
        result.current.onToggleCompare("experimental");
      });

      expect(result.current.compare.size).toBe(2);
      expect(result.current.compare.has("treated")).toBe(true);
      expect(result.current.compare.has("experimental")).toBe(true);
    });
  });

  describe("validation", () => {
    test("valid is false when only baseline is selected", () => {
      const { result } = renderHook(() => useBaselineContrasts("condition"));

      act(() => {
        result.current.onSelectBaseline("control");
      });

      expect(result.current.valid).toBe(false);
    });

    test("valid is false when only compare values are selected", () => {
      const { result } = renderHook(() => useBaselineContrasts("condition"));

      act(() => {
        result.current.onToggleCompare("treated");
      });

      expect(result.current.valid).toBe(false);
    });

    test("valid is true when baseline and compare values are selected", () => {
      const { result } = renderHook(() => useBaselineContrasts("condition"));

      act(() => {
        result.current.onSelectBaseline("control");
      });
      act(() => {
        result.current.onToggleCompare("treated");
      });

      expect(result.current.valid).toBe(true);
    });
  });

  describe("primaryFactor changes", () => {
    test("resets state when primaryFactor changes", () => {
      const { rerender, result } = renderHook(
        (props: { primaryFactor: string }) =>
          useBaselineContrasts(props.primaryFactor),
        { initialProps: { primaryFactor: "condition" } }
      );

      act(() => {
        result.current.onSelectBaseline("control");
      });
      act(() => {
        result.current.onToggleCompare("treated");
      });

      expect(result.current.baseline).toBe("control");
      expect(result.current.compare.size).toBe(1);
      expect(result.current.valid).toBe(true);

      rerender({ primaryFactor: "treatment" });

      expect(result.current.baseline).toBeNull();
      expect(result.current.compare.size).toBe(0);
      expect(result.current.valid).toBe(false);
    });
  });
});

describe("buildBaselineContrasts", () => {
  test("returns null when baseline is null", () => {
    const result = buildBaselineContrasts(null, new Set(["treated"]));

    expect(result).toBeNull();
  });

  test("returns null when compare set is empty", () => {
    const result = buildBaselineContrasts("control", new Set());

    expect(result).toBeNull();
  });

  test("returns null when both baseline is null and compare is empty", () => {
    const result = buildBaselineContrasts(null, new Set());

    expect(result).toBeNull();
  });

  test("returns BaselineContrasts when baseline and compare are valid", () => {
    const result = buildBaselineContrasts(
      "control",
      new Set(["treated", "experimental"])
    );

    expect(result).toEqual({
      baseline: "control",
      compare: ["treated", "experimental"],
      type: "BASELINE",
    });
  });

  test("returns BaselineContrasts with single compare value", () => {
    const result = buildBaselineContrasts("control", new Set(["treated"]));

    expect(result).toEqual({
      baseline: "control",
      compare: ["treated"],
      type: "BASELINE",
    });
  });

  test("converts compare Set to array", () => {
    const compareSet = new Set(["a", "b", "c"]);
    const result = buildBaselineContrasts("baseline", compareSet);

    expect(result).not.toBeNull();
    expect(Array.isArray(result?.compare)).toBe(true);
    expect(result?.compare).toHaveLength(3);
  });
});

describe("createInitialCompare", () => {
  test("returns an empty Set", () => {
    const result = createInitialCompare();

    expect(result.size).toBe(0);
  });

  test("returns a new Set instance each time", () => {
    const first = createInitialCompare();
    const second = createInitialCompare();

    expect(first).not.toBe(second);
  });
});

describe("removeFromCompareUpdater", () => {
  test("removes value from set if present", () => {
    const prev = new Set(["a", "b", "c"]);

    const result = removeFromCompareUpdater("b")(prev);

    expect(result.has("b")).toBe(false);
    expect(result.has("a")).toBe(true);
    expect(result.has("c")).toBe(true);
    expect(result.size).toBe(2);
  });

  test("returns same set if value not present", () => {
    const prev = new Set(["a", "b"]);

    const result = removeFromCompareUpdater("c")(prev);

    expect(result).toBe(prev);
  });

  test("does not mutate the original set", () => {
    const prev = new Set(["a", "b", "c"]);

    removeFromCompareUpdater("b")(prev);

    expect(prev.has("b")).toBe(true);
    expect(prev.size).toBe(3);
  });

  test("removes last value from set", () => {
    const prev = new Set(["a"]);

    const result = removeFromCompareUpdater("a")(prev);

    expect(result.size).toBe(0);
  });
});

describe("selectBaselineUpdater", () => {
  test("returns the new value regardless of previous state", () => {
    const result = selectBaselineUpdater("control")(null);

    expect(result).toBe("control");
  });

  test("replaces existing value", () => {
    const result = selectBaselineUpdater("treated")("control");

    expect(result).toBe("treated");
  });

  test("returns same value when selecting same baseline", () => {
    const result = selectBaselineUpdater("control")("control");

    expect(result).toBe("control");
  });
});

describe("toggleCompareUpdater", () => {
  test("adds value to empty set", () => {
    const prev = new Set<string>();

    const result = toggleCompareUpdater("a")(prev);

    expect(result.has("a")).toBe(true);
    expect(result.size).toBe(1);
  });

  test("adds value to existing set", () => {
    const prev = new Set(["a", "b"]);

    const result = toggleCompareUpdater("c")(prev);

    expect(result.has("c")).toBe(true);
    expect(result.size).toBe(3);
  });

  test("removes value if already present", () => {
    const prev = new Set(["a", "b", "c"]);

    const result = toggleCompareUpdater("b")(prev);

    expect(result.has("b")).toBe(false);
    expect(result.size).toBe(2);
  });

  test("does not mutate the original set when adding", () => {
    const prev = new Set(["a"]);

    toggleCompareUpdater("b")(prev);

    expect(prev.has("b")).toBe(false);
    expect(prev.size).toBe(1);
  });

  test("does not mutate the original set when removing", () => {
    const prev = new Set(["a", "b"]);

    toggleCompareUpdater("b")(prev);

    expect(prev.has("b")).toBe(true);
    expect(prev.size).toBe(2);
  });
});

describe("validateBaselineContrasts", () => {
  test("returns true when baseline and compare are valid", () => {
    const result = validateBaselineContrasts("control", new Set(["treated"]));

    expect(result).toBe(true);
  });

  test("returns true with multiple compare values", () => {
    const result = validateBaselineContrasts(
      "control",
      new Set(["treated", "experimental"])
    );

    expect(result).toBe(true);
  });

  test("returns false when baseline is null", () => {
    const result = validateBaselineContrasts(null, new Set(["treated"]));

    expect(result).toBe(false);
  });

  test("returns false when compare set is empty", () => {
    const result = validateBaselineContrasts("control", new Set());

    expect(result).toBe(false);
  });

  test("returns false when both baseline is null and compare is empty", () => {
    const result = validateBaselineContrasts(null, new Set());

    expect(result).toBe(false);
  });
});
