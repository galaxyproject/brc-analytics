import { type ConfiguredInput } from "@repo/shared/views/WorkflowInputsView/hooks/UseConfigureInputs/types";

export interface Props {
  factorValues: string[];
  primaryFactor: ConfiguredInput["primaryFactor"];
}
