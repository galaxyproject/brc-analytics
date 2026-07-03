import { useCallback, useMemo, useState } from "react";
import { ConfiguredInput } from "../../../../../../../../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import { ClassificationMap, COLUMN_TYPE } from "../../types";
import { getColumnNames, validateClassifications } from "../../utils";
import { UseColumnClassification } from "./types";
import { initClassifications, updateClassification } from "./utils";

/**
 * Hook to manage column classification state and validation.
 * @param sampleSheet - The sample sheet data from configured input.
 * @returns The column classification state, classify action, and validation result.
 */
export function useColumnClassification(
  sampleSheet: ConfiguredInput["sampleSheet"]
): UseColumnClassification {
  const columnNames = useMemo(() => getColumnNames(sampleSheet), [sampleSheet]);

  const [classificationMap, setClassificationMap] = useState<ClassificationMap>(
    () => initClassifications(columnNames)
  );

  // Re-initialize when the columns change. Adjusting state during render
  // (tracking the previous value) is React's recommended alternative to an
  // init-in-effect — it avoids the extra commit + re-render.
  const [prevColumnNames, setPrevColumnNames] = useState(columnNames);
  if (columnNames !== prevColumnNames) {
    setPrevColumnNames(columnNames);
    if (columnNames.length > 0)
      setClassificationMap(initClassifications(columnNames));
  }

  const classifications = useMemo(
    () => Object.fromEntries(classificationMap),
    [classificationMap]
  );

  const validation = useMemo(
    () => validateClassifications(classifications),
    [classifications]
  );

  /**
   * Updates the classification for a specific column.
   * @param columnName - The name of the column to update.
   * @param columnType - The new classification for the column.
   */
  const onClassify = useCallback(
    (columnName: string, columnType: COLUMN_TYPE): void => {
      setClassificationMap(updateClassification(columnName, columnType));
    },
    []
  );

  return {
    classifications,
    onClassify,
    validation,
  };
}
