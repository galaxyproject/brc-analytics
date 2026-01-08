import { OnConfigure } from "../../../../../../../../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import { StepProps } from "../../../types";

export interface Props {
  onConfigure: OnConfigure;
  stepKey: StepProps["stepKey"];
}
