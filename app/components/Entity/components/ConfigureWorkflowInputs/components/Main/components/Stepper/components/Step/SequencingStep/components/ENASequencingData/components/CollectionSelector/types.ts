import { ReadRun } from "../../types";
import { OnConfigure } from "../../../../../../../../../../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import { Table } from "@tanstack/react-table";

export interface Props {
  onClose: () => void;
  onConfigure: OnConfigure;
  open: boolean;
  selectedCount: number;
  stepKey: "readRunsSingle" | "readRunsPaired";
  table: Table<ReadRun>;
}
