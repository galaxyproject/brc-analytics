import { EnaSequencingReads } from "../../../../../../../../../../../../../utils/galaxy-api/entities";
import { ConfiguredInput } from "../../../../../../../../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import { StepProps } from "../../../types";
import { SEQUENCING_DATA_TYPE } from "../../types";
import { LIBRARY_LAYOUT_TO_CONFIGURE_INPUT_KEY } from "./constants";
import { ReadRun } from "./types";

/**
 * Clears the selected step.
 * @param value - Null or `[]`.
 * @returns Partial configured input.
 */
export function clearSequencingData(
  value: EnaSequencingReads[] | null = null
): Partial<ConfiguredInput> {
  return { readRunsPaired: value, readRunsSingle: value };
}

/**
 * Returns the number of selected sequencing runs.
 * @param configuredInput - Configured input.
 * @returns Number of selected sequencing runs.
 */
export function getSelectedCount(configuredInput: ConfiguredInput): number {
  const { readRunsPaired, readRunsSingle } = configuredInput;
  return (readRunsPaired?.length ?? 0) + (readRunsSingle?.length ?? 0);
}

/**
 * Returns the sequencing data for the selected rows.
 * @param selectedRows - Selected rows.
 * @returns Partial configured input.
 */
export function getSequencingData(
  selectedRows: ReadRun[]
): Partial<ConfiguredInput> {
  const sequencingDataByType = getSequencingDataByType(selectedRows);
  const configuredInput: Partial<ConfiguredInput> = {
    readRunsPaired: null,
    readRunsSingle: null,
  };
  for (const [key, value] of sequencingDataByType.entries()) {
    // Guard to satisfy Partial<ConfiguredInput>: only assign when key is a ConfiguredInput field ("readRunsPaired" | "readRunsSingle").
    if (key === "readRunsPaired" || key === "readRunsSingle") {
      const sequencingData = value.length > 0 ? value : null;
      configuredInput[key] = sequencingData;
    }
  }
  return configuredInput;
}

/**
 * Gets the sequencing data by type.
 * @param selectedRows - Selected rows.
 * @returns Map of sequencing data by type.
 */
export function getSequencingDataByType(
  selectedRows: ReadRun[]
): Map<SEQUENCING_DATA_TYPE, EnaSequencingReads[]> {
  const sequencingDataByType = new Map<
    SEQUENCING_DATA_TYPE,
    EnaSequencingReads[]
  >();
  selectedRows.forEach((row) => {
    const { library_layout } = row;
    // Map the library layout to the configure input key.
    const key = LIBRARY_LAYOUT_TO_CONFIGURE_INPUT_KEY[library_layout];
    // Get the list of sequencing data for the configure input key.
    const value = sequencingDataByType.get(key) || [];
    // Add the sequencing data to the list.
    value.push(mapSequencingDataToConfiguredValue(row));
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
  stepKey: StepProps["stepKey"]
): Partial<ConfiguredInput> {
  if (stepKey === SEQUENCING_DATA_TYPE.READ_RUNS_ANY) {
    return { readRunsPaired: [], readRunsSingle: [] };
  }

  return { readRunsPaired: null, readRunsSingle: null, [stepKey]: [] };
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
