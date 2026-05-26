import { OnConfigure } from "../../../../../../../../../../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import { OnClassify } from "../../../../hooks/UseColumnClassification/types";
import { COLUMN_TYPE, ColumnClassifications } from "../../../../types";

export interface Props {
  classifications: ColumnClassifications;
  columnName: string;
  columnType: COLUMN_TYPE | null;
  onClassify: OnClassify;
  onConfigure: OnConfigure;
}
