import { OnConfigure } from "../../../../../../../../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import { SEQUENCING_DATA_TYPE } from "../../types";

export interface Props {
  onConfigure: OnConfigure;
  stepKey: SEQUENCING_DATA_TYPE;
}
