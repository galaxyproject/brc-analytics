import { ReadRun } from "../../types";
import { OnConfigure } from "../../../../../../../../../../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import { Table } from "@tanstack/react-table";
import { SEQUENCING_DATA_TYPE } from "../../../../types";

export interface Props {
  onClose: () => void;
  onConfigure: OnConfigure;
  open: boolean;
  selectedCount: number;
  stepKey: SEQUENCING_DATA_TYPE;
  table: Table<ReadRun>;
}
