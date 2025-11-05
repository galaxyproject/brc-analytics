import type { Table } from "@tanstack/react-table";
import { ReadRun } from "../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/components/ENASequencingData/types";
import { resetColumnFilters } from "../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/components/ENASequencingData/components/CollectionSelector/utils";
import { ENA_QUERY_METHOD } from "../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/types";

describe("resetColumnFilters", () => {
  test("resets filters when ACCESSION and no rows selected", () => {
    const { spy, table } = getMockTable(ENA_QUERY_METHOD.ACCESSION, true);
    resetColumnFilters(table, {});
    expect(spy).toHaveBeenCalledTimes(1);
  });

  test("does not reset when ACCESSION and rows are selected", () => {
    const { spy, table } = getMockTable(ENA_QUERY_METHOD.ACCESSION, true);
    resetColumnFilters(table, { someRowId: true });
    expect(spy).not.toHaveBeenCalled();
  });

  test("does not reset when TAXONOMY_ID and no rows selected", () => {
    const { spy, table } = getMockTable(ENA_QUERY_METHOD.TAXONOMY_ID, true);
    resetColumnFilters(table, {});
    expect(spy).not.toHaveBeenCalled();
  });

  test("does not reset when TAXONOMY_ID and rows are selected", () => {
    const { spy, table } = getMockTable(ENA_QUERY_METHOD.TAXONOMY_ID, true);
    resetColumnFilters(table, { someRowId: true });
    expect(spy).not.toHaveBeenCalled();
  });

  test("safe when meta is missing", () => {
    const { spy, table } = getMockTable(undefined, false);
    expect(() => resetColumnFilters(table, {})).not.toThrow();
    expect(spy).not.toHaveBeenCalled();
  });
});

/**
 * Creates a mock table.
 * @param enaQueryMethod - ENA query method.
 * @param withMeta - Whether to include meta.
 * @returns Mock table.
 */
function getMockTable(
  enaQueryMethod?: ENA_QUERY_METHOD,
  withMeta: boolean = true
): { spy: jest.Mock; table: Table<ReadRun> } {
  const resetColumnFilters = jest.fn();
  const meta = { meta: { enaQueryMethod } };
  const options = withMeta ? meta : undefined;
  const table = { options, resetColumnFilters } as unknown as Table<ReadRun>;
  return { spy: resetColumnFilters, table };
}
