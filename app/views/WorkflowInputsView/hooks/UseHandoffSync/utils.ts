import {
  mapReadRuns,
  sanitizeReadRuns,
} from "../../../../components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/components/ENASequencingData/components/CollectionSelector/hooks/UseTable/dataTransforms";
import { BaseReadRun } from "../../../../components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/components/ENASequencingData/types";
import { getSequencingData } from "../../../../components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/components/ENASequencingData/utils";
import { ConfiguredInput } from "../UseConfigureInputs/types";

/**
 * Translate raw ENA read-run data into a Partial<ConfiguredInput> in the
 * array-field shape. The caller is expected to run this result through
 * `translateForSequencingStep` if the target workflow's sequencing step is
 * file-based.
 * @param data - Raw ENA read-run rows.
 * @returns Partial input update in array-field shape.
 */
export function buildEnaUpdates(data: BaseReadRun[]): Partial<ConfiguredInput> {
  return getSequencingData(sanitizeReadRuns(mapReadRuns(data)));
}
