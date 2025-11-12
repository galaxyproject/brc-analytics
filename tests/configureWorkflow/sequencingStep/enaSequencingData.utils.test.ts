import {
  clearSequencingData,
  getRowSelectionState,
  getSelectedCount,
  getSequencingData,
  getSequencingDataByType,
  getUploadMyOwnSequencingData,
  mapSequencingDataToConfiguredValue,
} from "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/components/ENASequencingData/utils";
import { SEQUENCING_DATA_TYPE } from "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/types";
import type { ReadRun } from "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/components/ENASequencingData/types";
import type { Table } from "@tanstack/react-table";
import type { ConfiguredInput } from "../../../app/views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import type { EnaSequencingReads } from "../../../app/utils/galaxy-api/entities";

const CONFIGURED_INPUT: Record<string, EnaSequencingReads[]> = {
  PAIRED: [
    { md5Hashes: "m2", runAccession: "P1", urls: "ftps://p1a;ftps://p1b" },
  ],
  SINGLE: [{ md5Hashes: "m1", runAccession: "S1", urls: "ftps://s1" }],
};

const READ_RUNS: Record<string, ReadRun> = {
  PAIRED: {
    fastq_ftp: "ftps://p1a;ftps://p1b",
    fastq_md5: "m2",
    library_layout: "PAIRED",
    run_accession: "P1",
  } as ReadRun,
  SINGLE: {
    fastq_ftp: "ftps://s1",
    fastq_md5: "m1",
    library_layout: "SINGLE",
    run_accession: "S1",
  } as ReadRun,
};

describe("clearSequencingData", () => {
  test("returns nulls by default", () => {
    expect(clearSequencingData()).toEqual({
      readRunsPaired: null,
      readRunsSingle: null,
    });
  });

  test("returns empty arrays when provided []", () => {
    expect(clearSequencingData([])).toEqual({
      readRunsPaired: [],
      readRunsSingle: [],
    });
  });
});

describe("getRowSelectionState", () => {
  test("returns empty object when no configured input", () => {
    expect(getRowSelectionState({})).toEqual({});
  });

  test("returns row selection state for paired configured input", () => {
    expect(
      getRowSelectionState({
        readRunsPaired: CONFIGURED_INPUT.PAIRED,
      })
    ).toEqual({ P1: true });
  });

  test("returns row selection state for paired and single configured input", () => {
    expect(
      getRowSelectionState({
        readRunsPaired: CONFIGURED_INPUT.PAIRED,
        readRunsSingle: CONFIGURED_INPUT.SINGLE,
      })
    ).toEqual({ P1: true, S1: true });
  });
});

describe("getSelectedCount", () => {
  test("sums lengths and handles null/undefined", () => {
    expect(
      getSelectedCount({
        readRunsPaired: CONFIGURED_INPUT.PAIRED,
        readRunsSingle: null,
      } as ConfiguredInput)
    ).toBe(1);
    expect(
      getSelectedCount({
        readRunsPaired: undefined,
        readRunsSingle: [],
      } as ConfiguredInput)
    ).toBe(0);
    expect(
      getSelectedCount({
        readRunsPaired: CONFIGURED_INPUT.PAIRED,
        readRunsSingle: CONFIGURED_INPUT.SINGLE,
      } as ConfiguredInput)
    ).toBe(2);
  });
});

describe("mapSequencingDataToConfiguredValue", () => {
  test("maps fields correctly", () => {
    expect(mapSequencingDataToConfiguredValue(READ_RUNS.SINGLE)).toEqual({
      md5Hashes: "m1",
      runAccession: "S1",
      urls: "ftps://s1",
    });
  });
});

describe("getSequencingDataByType", () => {
  test("groups selection by library_layout and maps values", () => {
    const sequencingDataByType = getSequencingDataByType(
      makeTable([READ_RUNS.SINGLE, READ_RUNS.PAIRED])
    );
    expect(
      sequencingDataByType.get(SEQUENCING_DATA_TYPE.READ_RUNS_SINGLE)
    ).toEqual(CONFIGURED_INPUT.SINGLE);
    expect(
      sequencingDataByType.get(SEQUENCING_DATA_TYPE.READ_RUNS_PAIRED)
    ).toEqual(CONFIGURED_INPUT.PAIRED);
  });
});

describe("getSequencingData", () => {
  test("returns partial configured input with arrays per layout", () => {
    expect(
      getSequencingData(makeTable([READ_RUNS.SINGLE, READ_RUNS.PAIRED]))
    ).toEqual({
      readRunsPaired: CONFIGURED_INPUT.PAIRED,
      readRunsSingle: CONFIGURED_INPUT.SINGLE,
    });
  });

  test("sets null for empty groups and when no selection", () => {
    expect(getSequencingData(makeTable([READ_RUNS.SINGLE]))).toEqual({
      readRunsPaired: null,
      readRunsSingle: CONFIGURED_INPUT.SINGLE,
    });

    expect(getSequencingData(makeTable([]))).toEqual({
      readRunsPaired: null,
      readRunsSingle: null,
    });
  });
});

describe("getUploadMyOwnSequencingData", () => {
  test("returns empty arrays for both types", () => {
    expect(getUploadMyOwnSequencingData("readRunsAny")).toEqual({
      readRunsPaired: [],
      readRunsSingle: [],
    });
  });

  test("returns empty array for single type", () => {
    expect(getUploadMyOwnSequencingData("readRunsSingle")).toEqual({
      readRunsPaired: null,
      readRunsSingle: [],
    });
  });

  test("returns empty array for paired type", () => {
    expect(getUploadMyOwnSequencingData("readRunsPaired")).toEqual({
      readRunsPaired: [],
      readRunsSingle: null,
    });
  });
});

/**
 * Creates a table with the given selected rows.
 * @param selected - Selected rows.
 * @returns Table.
 */
function makeTable(selected: ReadRun[]): Table<ReadRun> {
  return {
    getSelectedRowModel: () => ({
      rows: selected.map((original) => ({ original })),
    }),
  } as unknown as Table<ReadRun>;
}
