import { useCallback, useEffect, useMemo, useState } from "react";
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
  const [classificationMap, setClassificationMap] = useState<ClassificationMap>(
    new Map()
  );

  const columnNames = useMemo(() => getColumnNames(sampleSheet), [sampleSheet]);

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

  useEffect(() => {
    if (columnNames.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- init-on-dependency-change effect (react-hooks v7 anti-pattern); refactor tracked in #1393
      setClassificationMap(initClassifications(columnNames));
    }
  }, [columnNames]);

  return {
    classifications,
    onClassify,
    validation,
  };
}
