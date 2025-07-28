import { OnConfigure } from "../../../../../../../../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";

export interface Props {
  onConfigure: OnConfigure;
  stepKey: "readRunsSingle" | "readRunsPaired";
}
