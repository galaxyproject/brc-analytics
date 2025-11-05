import { OnRequestData, Status } from "../../hooks/UseENADataByAccession/types";
import { Table } from "@tanstack/react-table";
import { ReadRun } from "../../types";

export interface Props {
  clearErrors: () => void;
  enaAccessionStatus: Status;
  onClose: () => void;
  onContinue: () => void;
  onRequestData: OnRequestData;
  open: boolean;
  table: Table<ReadRun>;
}
