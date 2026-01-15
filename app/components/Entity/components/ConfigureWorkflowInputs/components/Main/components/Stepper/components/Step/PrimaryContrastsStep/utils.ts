import { ConfiguredInput } from "../../../../../../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";

/**
 * Extracts unique values from the primary factor column in the sample sheet.
 * @param configuredInput - Configured input data.
 * @returns Sorted array of unique values.
 */
export function getUniqueFactorValues(
  configuredInput: ConfiguredInput
): string[] {
  const { primaryFactor, sampleSheet } = configuredInput;

  if (!sampleSheet || !primaryFactor) return [];

  const values = new Set<string>();
  for (const row of sampleSheet) {
    const value = row[primaryFactor];
    if (value) values.add(value);
  }

  return [...values].sort();
}
