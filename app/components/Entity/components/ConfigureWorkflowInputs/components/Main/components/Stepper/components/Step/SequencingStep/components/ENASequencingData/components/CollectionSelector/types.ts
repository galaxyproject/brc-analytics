import { ReadRun } from "../../types";
import {
  ConfiguredInput,
  OnConfigure,
} from "../../../../../../../../../../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import { Table } from "@tanstack/react-table";
import { DialogProps } from "@mui/material";

export interface Props extends Pick<DialogProps, "onTransitionExited"> {
  configuredInput: ConfiguredInput;
  onClose: () => void;
  onConfigure: OnConfigure;
  open: boolean;
  table: Table<ReadRun>;
}
