import { DialogProps } from "@mui/material";
import { Table } from "@tanstack/react-table";
import { ReadRun } from "../../types";

export interface Props extends Pick<
  DialogProps,
  "onTransitionEnter" | "onTransitionExited"
> {
  onCancel: () => void;
  onClose: () => void;
  open: boolean;
  table: Table<ReadRun>;
}
