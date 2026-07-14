import { useTaxonomyMatches } from "@/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/components/ENASequencingData/components/DataSelector/components/Alert/hooks/UseTaxonomyMatches/hook";
import type { ReadRun } from "@/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/components/ENASequencingData/types";
import type { Table } from "@tanstack/react-table";
import { renderHook } from "@testing-library/react";

/**
 * Build a minimal Table stub exposing just the row models the hook reads.
 * @param coreCount - Number of core (unfiltered) rows.
 * @param filteredCount - Number of filtered rows.
 * @returns Table stub.
 */
function mockTable(coreCount: number, filteredCount: number): Table<ReadRun> {
  return {
    getCoreRowModel: () => ({ rows: new Array(coreCount).fill({}) }),
    getFilteredRowModel: () => ({ rows: new Array(filteredCount).fill({}) }),
  } as unknown as Table<ReadRun>;
}

describe("useTaxonomyMatches", () => {
  test("stays null until the table has core rows", () => {
    const { result } = renderHook(() => useTaxonomyMatches(mockTable(0, 0)));

    expect(result.current.taxonomyMatches).toBeNull();
  });

  test("captures the filtered count once the table has data", () => {
    const { result } = renderHook(() => useTaxonomyMatches(mockTable(10, 3)));

    expect(result.current.taxonomyMatches).toBe(3);
  });

  test("captures a legitimate zero-match count (0, not the null sentinel)", () => {
    const { result } = renderHook(() => useTaxonomyMatches(mockTable(10, 0)));

    expect(result.current.taxonomyMatches).toBe(0);
  });

  test("captures the count a single time, then ignores later changes", () => {
    const { rerender, result } = renderHook(
      ({ core, filtered }) => useTaxonomyMatches(mockTable(core, filtered)),
      { initialProps: { core: 10, filtered: 3 } }
    );

    expect(result.current.taxonomyMatches).toBe(3);

    // Later filtering changes the counts, but the one-shot value is retained.
    rerender({ core: 10, filtered: 7 });

    expect(result.current.taxonomyMatches).toBe(3);
  });

  test("does not capture on the render where core data first arrives as empty", () => {
    const { rerender, result } = renderHook(
      ({ core, filtered }) => useTaxonomyMatches(mockTable(core, filtered)),
      { initialProps: { core: 0, filtered: 0 } }
    );

    expect(result.current.taxonomyMatches).toBeNull();

    rerender({ core: 5, filtered: 2 });

    expect(result.current.taxonomyMatches).toBe(2);
  });
});
