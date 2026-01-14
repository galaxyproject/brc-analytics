import { ColumnClassifications } from "../../types";
import { OnClassify } from "../../hooks/UseColumnClassification/types";
import { OnConfigure } from "../../../../../../../../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";

export interface Props {
  classifications: ColumnClassifications;
  onClassify: OnClassify;
  onConfigure: OnConfigure;
}
