import { useCallback, useEffect, useMemo, useState } from "react";
import { ColumnClassifications, COLUMN_TYPE } from "../../types";
import { getColumnNames, validateClassifications } from "../../utils";
import { UseColumnClassification } from "./types";
import { initClassifications, updateClassification } from "./utils";
import { ConfiguredInput } from "../../../../../../../../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";

/**
 * Hook to manage column classification state and validation.
 * @param sampleSheet - The sample sheet data from configured input.
 * @returns The column classification state, classify action, and validation result.
 */
export function useColumnClassification(
  sampleSheet: ConfiguredInput["sampleSheet"]
): UseColumnClassification {
  const [classifications, setClassifications] = useState<ColumnClassifications>(
    new Map()
  );

  const columnNames = useMemo(() => getColumnNames(sampleSheet), [sampleSheet]);

  useEffect(() => {
    if (columnNames.length > 0) {
      // Initialize classifications when column names change.
      setClassifications(initClassifications(columnNames));
    }
  }, [columnNames]);

  /**
   * Updates the classification for a specific column.
   * @param columnName - The name of the column to update.
   * @param columnType - The new classification for the column.
   */
  const onClassify = useCallback(
    (columnName: string, columnType: COLUMN_TYPE): void => {
      setClassifications(updateClassification(columnName, columnType));
    },
    []
  );

  /**
   * Validates the column classifications.
   * @returns The validation result with valid status and error messages.
   */
  const validation = useMemo(
    () => validateClassifications(classifications),
    [classifications]
  );

  return {
    classifications,
    onClassify,
    validation,
  };
}
