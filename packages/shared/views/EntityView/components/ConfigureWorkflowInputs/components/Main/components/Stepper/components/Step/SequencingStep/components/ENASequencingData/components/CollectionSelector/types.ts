import { type DialogProps } from "@mui/material";
import { type ReadRun } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/components/ENASequencingData/types";
import { type Table } from "@tanstack/react-table";

export interface Props extends Pick<
  DialogProps,
  "onTransitionEnter" | "onTransitionExited"
> {
  onCancel: () => void;
  onClose: () => void;
  open: boolean;
  table: Table<ReadRun>;
}
