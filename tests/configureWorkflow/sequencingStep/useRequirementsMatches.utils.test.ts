import { buildRequirementsMatches } from "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/components/ENASequencingData/components/CollectionSummary/components/Alert/hooks/UseRequirementsMatches/utils";
import type { ColumnFiltersState, Row } from "@tanstack/react-table";
import type { ReadRun } from "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/components/ENASequencingData/types";

describe("buildRequirementsMatches", () => {
  test("returns empty array when no column filters", () => {
    const filters: ColumnFiltersState = [];
    const rows = makeRows(
      { library_layout: "SINGLE" },
      { library_layout: "PAIRED" }
    );

    expect(buildRequirementsMatches(filters, rows)).toEqual([]);
  });

  test("returns empty array when there are no mismatches", () => {
    const filters: ColumnFiltersState = [
      { id: "library_layout", value: ["SINGLE"] },
    ];
    const rows = makeRows(
      { library_layout: "SINGLE" },
      { library_layout: "SINGLE" }
    );

    expect(buildRequirementsMatches(filters, rows)).toEqual([]);
  });

  test("returns a message when there is a mismatch for a single filter", () => {
    const filters: ColumnFiltersState = [
      { id: "library_layout", value: ["SINGLE"] },
    ];
    const rows = makeRows(
      { library_layout: "SINGLE" },
      { library_layout: "PAIRED" }
    );

    expect(buildRequirementsMatches(filters, rows)).toEqual([
      "Library layout mismatch: expected SINGLE, but PAIRED selected",
    ]);
  });

  test("returns a message with multiple unmatched values and 'OR' joined expected values", () => {
    const filters: ColumnFiltersState = [
      { id: "library_strategy", value: ["RNA-Seq", "ChIP-Seq"] },
    ];
    const rows = makeRows(
      { library_strategy: "WGS" },
      { library_strategy: "Metagenome" }
    );

    expect(buildRequirementsMatches(filters, rows)).toEqual([
      "Data type mismatch: expected RNA-Seq OR ChIP-Seq, but WGS, Metagenome selected",
    ]);
  });

  test("skips filters whose value is not an array", () => {
    const filters = [
      { id: "description", value: "some text" },
    ] as unknown as ColumnFiltersState;
    const rows = makeRows(
      { description: "some text" },
      { description: "other" }
    );

    expect(buildRequirementsMatches(filters, rows)).toEqual([]);
  });

  test("returns multiple messages for multiple mismatched filters in given order", () => {
    const filters: ColumnFiltersState = [
      { id: "library_layout", value: ["SINGLE"] },
      { id: "library_strategy", value: ["RNA-Seq"] },
    ];
    const rows = makeRows(
      { library_layout: "PAIRED", library_strategy: "WGS" },
      { library_layout: "SINGLE", library_strategy: "WGS" }
    );

    expect(buildRequirementsMatches(filters, rows)).toEqual([
      "Library layout mismatch: expected SINGLE, but PAIRED selected",
      "Data type mismatch: expected RNA-Seq, but WGS selected",
    ]);
  });
});

/**
 * Creates TanStack rows from partial ReadRun objects for unit tests.
 * @param runs - Partial ReadRun objects to wrap as table rows.
 * @returns TanStack rows.
 */
function makeRows(...runs: Array<Partial<ReadRun>>): Row<ReadRun>[] {
  return runs.map(
    (r) => ({ original: r as ReadRun }) as unknown as Row<ReadRun>
  );
}
