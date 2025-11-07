import { OnRequestData, Status } from "../../hooks/UseENADataByAccession/types";
import { Table } from "@tanstack/react-table";
import { BaseReadRun, ReadRun } from "../../types";

export interface Props {
  clearErrors: () => void;
  enaAccessionStatus: Status;
  onClose: () => void;
  onContinue: () => void;
  onRequestData: OnRequestData<BaseReadRun>;
  open: boolean;
  switchToAccession: (data: BaseReadRun[]) => void;
  table: Table<ReadRun>;
}
