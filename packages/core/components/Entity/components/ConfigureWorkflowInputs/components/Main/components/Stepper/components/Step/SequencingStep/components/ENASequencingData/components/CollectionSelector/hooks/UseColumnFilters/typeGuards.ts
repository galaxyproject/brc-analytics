import { SEQUENCING_DATA_TYPE } from "@brc-analytics/core/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/types";

/**
 * Type guard for SEQUENCING_DATA_TYPE.
 * @param value - Value.
 * @returns True if the value is a SEQUENCING_DATA_TYPE, false otherwise.
 */
export function isSequencingDataType(
  value: string
): value is SEQUENCING_DATA_TYPE {
  return Object.values(SEQUENCING_DATA_TYPE).includes(
    value as SEQUENCING_DATA_TYPE
  );
}
