import { Table } from "@tanstack/react-table";
import { EnaSequencingReads } from "../../../../../../../../../../../../../utils/galaxy-api/entities";
import { ReadRun } from "./types";
import { SEQUENCING_DATA_TYPE } from "../../types";
import { ConfiguredInput } from "../../../../../../../../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import { LIBRARY_LAYOUT_TO_CONFIGURE_INPUT_KEY } from "./constants";

/**
 * Returns null or an empty array for the selected step i.e. clears the selected step.
 * @param stepKey - Step key.
 * @param value - Null or `[]`.
 * @returns Partial configured input.
 */
export function clearSequencingData(
  stepKey: SEQUENCING_DATA_TYPE,
  value: EnaSequencingReads[] | null = null
): Partial<ConfiguredInput> {
  // Clear the selected step for READ_RUNS_ANY.
  if (stepKey === SEQUENCING_DATA_TYPE.READ_RUNS_ANY) {
    return { readRunsPaired: value, readRunsSingle: value };
  }

  // Clear the selected step for READ_RUNS_PAIRED or READ_RUNS_SINGLE.
  return { [stepKey]: value };
}

/**
 * Returns the sequencing data for the selected rows.
 * @param table - Table.
 * @param stepKey - Step key.
 * @returns Partial configured input.
 */
export function getSequencingData(
  table: Table<ReadRun>,
  stepKey: SEQUENCING_DATA_TYPE
): Partial<ConfiguredInput> {
  const sequencingDataByType = getSequencingDataByType(table);
  const configuredInput: Partial<ConfiguredInput> = {
    readRunsPaired: null,
    readRunsSingle: null,
  };
  for (const [key, value] of sequencingDataByType.entries()) {
    // If the key is the selected step or READ_RUNS_ANY, add the sequencing data to the configured input.
    if (stepKey === key || stepKey === SEQUENCING_DATA_TYPE.READ_RUNS_ANY) {
      // Guard to satisfy Partial<ConfiguredInput>: only assign when key is a ConfiguredInput field ("readRunsPaired" | "readRunsSingle").
      if (key === "readRunsPaired" || key === "readRunsSingle") {
        const sequencingData = value.length > 0 ? value : null;
        configuredInput[key] = sequencingData;
      }
    }
  }
  return configuredInput;
}

/**
 * Gets the sequencing data by type.
 * @param table - Table.
 * @returns Map of sequencing data by type.
 */
export function getSequencingDataByType(
  table: Table<ReadRun>
): Map<SEQUENCING_DATA_TYPE, EnaSequencingReads[]> {
  const sequencingDataByType = new Map<
    SEQUENCING_DATA_TYPE,
    EnaSequencingReads[]
  >();
  table.getSelectedRowModel().rows.forEach((row) => {
    const { original } = row;
    const { library_layout } = original;
    // Map the library layout to the configure input key.
    const key = LIBRARY_LAYOUT_TO_CONFIGURE_INPUT_KEY[library_layout];
    // Get the list of sequencing data for the configure input key.
    const value = sequencingDataByType.get(key) || [];
    // Add the sequencing data to the list.
    value.push(mapSequencingDataToConfiguredValue(original));
    // Set the list of sequencing data for the configure input key.
    sequencingDataByType.set(key, value);
  });
  return sequencingDataByType;
}

/**
 * Returns sequencing data that represents "uploading my own data" i.e. an empty list.
 * @param stepKey - Step key.
 * @returns Partial configured input.
 */
export function getUploadMyOwnSequencingData(
  stepKey: SEQUENCING_DATA_TYPE
): Partial<ConfiguredInput> {
  return clearSequencingData(stepKey, []);
}

/**
 * Maps a ReadRun to an EnaSequencingReads.
 * @param row - ReadRun.
 * @returns EnaSequencingReads.
 */
export function mapSequencingDataToConfiguredValue(
  row: ReadRun
): EnaSequencingReads {
  return {
    md5Hashes: row.fastq_md5,
    runAccession: row.run_accession,
    urls: row.fastq_ftp,
  };
}
