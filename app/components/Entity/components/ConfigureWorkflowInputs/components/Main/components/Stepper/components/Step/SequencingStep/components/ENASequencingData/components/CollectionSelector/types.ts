import { ReadRun } from "@/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/components/ENASequencingData/types";
import { DialogProps } from "@mui/material";
import { Table } from "@tanstack/react-table";

export interface Props extends Pick<
  DialogProps,
  "onTransitionEnter" | "onTransitionExited"
> {
  onCancel: () => void;
  onClose: () => void;
  open: boolean;
  table: Table<ReadRun>;
}
