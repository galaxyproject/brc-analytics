import { ReadRun } from "../../types";
import { OnConfigure } from "../../../../../../../../../../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import { StepProps } from "../../../../../types";
import { Table } from "@tanstack/react-table";

export interface Props extends Pick<StepProps, "entryKey" | "entryLabel"> {
  isRunSelected: boolean;
  onClose: () => void;
  onConfigure: OnConfigure;
  open: boolean;
  table: Table<ReadRun>;
}
