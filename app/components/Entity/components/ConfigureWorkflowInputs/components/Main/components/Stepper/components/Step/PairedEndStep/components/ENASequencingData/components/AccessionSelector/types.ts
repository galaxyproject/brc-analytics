import { ClearErrors, OnRequestData, RequestStatus } from "../../hooks/UseENA/types";

export interface Props {
  clearErrors: ClearErrors;
  onClose: () => void;
  open: boolean;
  onRequestData: OnRequestData;
  onSelect: () => void;
  requestStatus: RequestStatus;
}
