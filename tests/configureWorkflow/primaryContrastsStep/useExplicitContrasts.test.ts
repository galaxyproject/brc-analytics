import { act, renderHook } from "@testing-library/react";
import { useExplicitContrasts } from "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/PrimaryContrastsStep/hooks/UseExplicitContrasts/hook";
import { buildExplicitContrasts } from "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/PrimaryContrastsStep/hooks/UseExplicitContrasts/utils";
import { ContrastPairs } from "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/PrimaryContrastsStep/hooks/UseExplicitContrasts/types";

describe("useExplicitContrasts", () => {
  describe("initialization", () => {
    test("initializes with one empty pair", () => {
      const { result } = renderHook(() => useExplicitContrasts("condition"));

      expect(result.current.pairs.size).toBe(1);
      expect([...result.current.pairs.values()]).toEqual([["", ""]]);
    });

    test("initializes with valid as false", () => {
      const { result } = renderHook(() => useExplicitContrasts("condition"));

      expect(result.current.valid).toBe(false);
    });
  });

  describe("onAddPair", () => {
    test("adds a new empty pair", () => {
      const { result } = renderHook(() => useExplicitContrasts("condition"));

      act(() => {
        result.current.onAddPair();
      });

      expect(result.current.pairs.size).toBe(2);
      expect([...result.current.pairs.values()]).toEqual([
        ["", ""],
        ["", ""],
      ]);
    });

    test("adds multiple pairs", () => {
      const { result } = renderHook(() => useExplicitContrasts("condition"));

      act(() => {
        result.current.onAddPair();
      });
      act(() => {
        result.current.onAddPair();
      });

      expect(result.current.pairs.size).toBe(3);
    });
  });

  describe("onRemovePair", () => {
    test("removes pair by id", () => {
      const { result } = renderHook(() => useExplicitContrasts("condition"));

      act(() => {
        result.current.onAddPair();
      });

      const [firstId, secondId] = [...result.current.pairs.keys()];

      act(() => {
        result.current.onUpdatePair(firstId, 0, "control");
      });
      act(() => {
        result.current.onUpdatePair(secondId, 0, "treated");
      });

      act(() => {
        result.current.onRemovePair(firstId);
      });

      expect(result.current.pairs.size).toBe(1);
      expect(result.current.pairs.get(secondId)).toEqual(["treated", ""]);
    });

    test("resets to initial state when removing last pair", () => {
      const { result } = renderHook(() => useExplicitContrasts("condition"));

      const [firstId] = [...result.current.pairs.keys()];

      act(() => {
        result.current.onRemovePair(firstId);
      });

      expect(result.current.pairs.size).toBe(1);
      expect([...result.current.pairs.values()]).toEqual([["", ""]]);
    });
  });

  describe("onUpdatePair", () => {
    test("updates first position of a pair", () => {
      const { result } = renderHook(() => useExplicitContrasts("condition"));

      const [firstId] = [...result.current.pairs.keys()];

      act(() => {
        result.current.onUpdatePair(firstId, 0, "control");
      });

      expect(result.current.pairs.get(firstId)).toEqual(["control", ""]);
    });

    test("updates second position of a pair", () => {
      const { result } = renderHook(() => useExplicitContrasts("condition"));

      const [firstId] = [...result.current.pairs.keys()];

      act(() => {
        result.current.onUpdatePair(firstId, 1, "treated");
      });

      expect(result.current.pairs.get(firstId)).toEqual(["", "treated"]);
    });

    test("updates specific pair in a list", () => {
      const { result } = renderHook(() => useExplicitContrasts("condition"));

      act(() => {
        result.current.onAddPair();
      });

      const [firstId, secondId] = [...result.current.pairs.keys()];

      act(() => {
        result.current.onUpdatePair(secondId, 0, "baseline");
      });
      act(() => {
        result.current.onUpdatePair(secondId, 1, "experiment");
      });

      expect(result.current.pairs.get(firstId)).toEqual(["", ""]);
      expect(result.current.pairs.get(secondId)).toEqual([
        "baseline",
        "experiment",
      ]);
    });
  });

  describe("validation", () => {
    test("valid becomes true when a complete pair is added", () => {
      const { result } = renderHook(() => useExplicitContrasts("condition"));

      const [firstId] = [...result.current.pairs.keys()];

      expect(result.current.valid).toBe(false);

      act(() => {
        result.current.onUpdatePair(firstId, 0, "control");
      });
      expect(result.current.valid).toBe(false);

      act(() => {
        result.current.onUpdatePair(firstId, 1, "treated");
      });
      expect(result.current.valid).toBe(true);
    });

    test("valid is false when pair has same value on both sides", () => {
      const { result } = renderHook(() => useExplicitContrasts("condition"));

      const [firstId] = [...result.current.pairs.keys()];

      act(() => {
        result.current.onUpdatePair(firstId, 0, "control");
      });
      act(() => {
        result.current.onUpdatePair(firstId, 1, "control");
      });

      expect(result.current.valid).toBe(false);
    });
  });

  describe("primaryFactor changes", () => {
    test("resets pairs when primaryFactor changes", () => {
      const { rerender, result } = renderHook(
        (props: { primaryFactor: string }) =>
          useExplicitContrasts(props.primaryFactor),
        { initialProps: { primaryFactor: "condition" } }
      );

      const [firstId] = [...result.current.pairs.keys()];

      // Add and configure pairs
      act(() => {
        result.current.onUpdatePair(firstId, 0, "control");
      });
      act(() => {
        result.current.onUpdatePair(firstId, 1, "treated");
      });
      act(() => {
        result.current.onAddPair();
      });

      expect(result.current.pairs.size).toBe(2);
      expect(result.current.valid).toBe(true);

      // Change primaryFactor
      rerender({ primaryFactor: "treatment" });

      // Pairs should be reset
      expect(result.current.pairs.size).toBe(1);
      expect([...result.current.pairs.values()]).toEqual([["", ""]]);
      expect(result.current.valid).toBe(false);
    });
  });
});

describe("buildExplicitContrasts", () => {
  test("returns null when pairs map is empty", () => {
    const pairs: ContrastPairs = new Map();
    const result = buildExplicitContrasts(pairs);

    expect(result).toBeNull();
  });

  test("returns null when all pairs are empty", () => {
    const pairs: ContrastPairs = new Map([
      ["0", ["", ""]],
      ["1", ["", ""]],
    ]);
    const result = buildExplicitContrasts(pairs);

    expect(result).toBeNull();
  });

  test("returns null when pairs have only one value filled", () => {
    const pairs: ContrastPairs = new Map([
      ["0", ["control", ""]],
      ["1", ["", "treated"]],
    ]);
    const result = buildExplicitContrasts(pairs);

    expect(result).toBeNull();
  });

  test("returns null when pairs have same value on both sides", () => {
    const pairs: ContrastPairs = new Map([["0", ["control", "control"]]]);
    const result = buildExplicitContrasts(pairs);

    expect(result).toBeNull();
  });

  test("returns ExplicitContrasts with valid pairs", () => {
    const pairs: ContrastPairs = new Map([
      ["0", ["control", "treated"]],
      ["1", ["baseline", "experiment"]],
    ]);
    const result = buildExplicitContrasts(pairs);

    expect(result).toEqual({
      pairs: [
        ["control", "treated"],
        ["baseline", "experiment"],
      ],
      type: "EXPLICIT",
    });
  });

  test("filters out invalid pairs and returns only valid ones", () => {
    const pairs: ContrastPairs = new Map([
      ["0", ["control", "treated"]],
      ["1", ["", ""]],
      ["2", ["a", "a"]],
      ["3", ["baseline", "experiment"]],
    ]);
    const result = buildExplicitContrasts(pairs);

    expect(result).toEqual({
      pairs: [
        ["control", "treated"],
        ["baseline", "experiment"],
      ],
      type: "EXPLICIT",
    });
  });

  test("returns ExplicitContrasts with single valid pair", () => {
    const pairs: ContrastPairs = new Map([["0", ["control", "treated"]]]);
    const result = buildExplicitContrasts(pairs);

    expect(result).toEqual({
      pairs: [["control", "treated"]],
      type: "EXPLICIT",
    });
  });
});
