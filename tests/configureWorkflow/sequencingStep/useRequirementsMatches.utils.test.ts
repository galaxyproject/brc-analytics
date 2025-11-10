import { buildRequirementWarnings } from "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/components/ENASequencingData/components/CollectionSummary/components/Alert/hooks/UseRequirementsMatches/utils";
import type { ColumnFiltersState, Row } from "@tanstack/react-table";
import type { ReadRun } from "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/components/ENASequencingData/types";
import { BRCDataCatalogGenome } from "../../../app/apis/catalog/brc-analytics-catalog/common/entities";
import { GA2AssemblyEntity } from "../../../app/apis/catalog/ga2/entities";

describe("buildRequirementWarnings", () => {
  const GENOME = makeGenome("123");

  test("returns empty array when no column filters", () => {
    const filters: ColumnFiltersState = [];
    const rows = makeRows(
      { library_layout: "SINGLE" },
      { library_layout: "PAIRED" }
    );

    expect(buildRequirementWarnings(filters, rows, GENOME)).toEqual([]);
  });

  test("returns empty array when there are filters but no selected rows", () => {
    const filters: ColumnFiltersState = [
      { id: "library_layout", value: ["SINGLE"] },
    ];
    const rows: Row<ReadRun>[] = [];

    expect(buildRequirementWarnings(filters, rows, GENOME)).toEqual([]);
  });

  test("falls back to raw key when label mapping is missing", () => {
    const filters: ColumnFiltersState = [
      { id: "instrument_model", value: ["Illumina"] },
    ];
    const rows = makeRows(
      { instrument_model: "Oxford" },
      { instrument_model: "Oxford" }
    );

    expect(buildRequirementWarnings(filters, rows, GENOME)).toEqual([
      "instrument_model mismatch: expected Illumina, but Oxford selected",
    ]);
  });

  test("de-duplicates actual mismatched values across rows", () => {
    const filters: ColumnFiltersState = [
      { id: "library_strategy", value: ["RNA-Seq"] },
    ];
    const rows = makeRows(
      { library_strategy: "WGS" },
      { library_strategy: "WGS" },
      { library_strategy: "WGS" }
    );

    expect(buildRequirementWarnings(filters, rows, GENOME)).toEqual([
      "Library strategy mismatch: expected RNA-Seq, but WGS selected",
    ]);
  });

  test("aggregates species warning before data warning", () => {
    const filters: ColumnFiltersState = [
      { id: "library_layout", value: ["SINGLE"] },
    ];
    const rows = makeRows(
      { library_layout: "PAIRED", scientific_name: "X", tax_id: "999" },
      { library_layout: "PAIRED", scientific_name: "Y", tax_id: "999" }
    );

    expect(buildRequirementWarnings(filters, rows, GENOME)).toEqual([
      expect.stringContaining(
        "Species mismatch: data is not from the selected taxonomy ID"
      ),
      "Library layout mismatch: expected SINGLE, but PAIRED selected",
    ]);
  });

  test("returns empty array when there are no mismatches", () => {
    const filters: ColumnFiltersState = [
      { id: "library_layout", value: ["SINGLE"] },
    ];
    const rows = makeRows(
      { library_layout: "SINGLE" },
      { library_layout: "SINGLE" }
    );

    expect(buildRequirementWarnings(filters, rows, GENOME)).toEqual([]);
  });

  test("returns a message when there is a mismatch for a single filter", () => {
    const filters: ColumnFiltersState = [
      { id: "library_layout", value: ["SINGLE"] },
    ];
    const rows = makeRows(
      { library_layout: "SINGLE" },
      { library_layout: "PAIRED" }
    );

    expect(buildRequirementWarnings(filters, rows, GENOME)).toEqual([
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

    expect(buildRequirementWarnings(filters, rows, GENOME)).toEqual([
      "Library strategy mismatch: expected RNA-Seq OR ChIP-Seq, but WGS, Metagenome selected",
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

    expect(buildRequirementWarnings(filters, rows, GENOME)).toEqual([]);
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

    expect(buildRequirementWarnings(filters, rows, GENOME)).toEqual([
      "Library layout mismatch: expected SINGLE, but PAIRED selected",
      "Library strategy mismatch: expected RNA-Seq, but WGS selected",
    ]);
  });

  test("adds a species mismatch message when genome tax ID does not match any selected rows", () => {
    const filters: ColumnFiltersState = [];
    const rows = makeRows(
      { library_layout: "SINGLE" },
      { library_layout: "PAIRED" }
    );

    expect(buildRequirementWarnings(filters, rows, makeGenome("999"))).toEqual([
      expect.stringContaining(
        "Species mismatch: data is not from the selected taxonomy ID"
      ),
    ]);
  });

  test("adds a species mismatch message when some selected rows have a different tax ID", () => {
    const filters: ColumnFiltersState = [];
    const rows = makeRows(
      { library_layout: "SINGLE", tax_id: "999" },
      { library_layout: "PAIRED", tax_id: "123" }
    );

    expect(buildRequirementWarnings(filters, rows, GENOME)).toEqual([
      expect.stringContaining(
        "Species mismatch: data is not from the selected taxonomy ID"
      ),
    ]);
  });
});

/**
 * Returns partial genome entity for unit tests.
 * @param ncbiTaxonomyId - NCBI Tax ID.
 * @returns genome entity.
 */
function makeGenome(
  ncbiTaxonomyId: string
): BRCDataCatalogGenome | GA2AssemblyEntity {
  return { ncbiTaxonomyId } as unknown as
    | BRCDataCatalogGenome
    | GA2AssemblyEntity;
}

/**
 * Creates TanStack rows from partial ReadRun objects for unit tests.
 * @param runs - Partial ReadRun objects to wrap as table rows.
 * @returns TanStack rows.
 */
function makeRows(...runs: Array<Partial<ReadRun>>): Row<ReadRun>[] {
  return runs.map((r) => {
    const original = { ...r } as ReadRun;
    if (original.tax_id === undefined) original.tax_id = "123";
    return { original } as unknown as Row<ReadRun>;
  });
}
