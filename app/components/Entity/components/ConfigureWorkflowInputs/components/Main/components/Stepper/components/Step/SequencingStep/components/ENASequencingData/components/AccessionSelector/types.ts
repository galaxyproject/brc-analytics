import { OnRequestData, Status } from "../../hooks/UseENADataByAccession/types";
import { BaseReadRun } from "../../types";

export interface Props {
  clearErrors: () => void;
  enaAccessionStatus: Status;
  onClose: () => void;
  onContinue: () => void;
  onRequestData: OnRequestData<BaseReadRun>;
  open: boolean;
  switchBrowseMethod: (data?: BaseReadRun[]) => void;
}
