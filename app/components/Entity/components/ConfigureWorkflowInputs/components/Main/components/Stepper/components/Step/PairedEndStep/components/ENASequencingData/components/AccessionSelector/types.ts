import { OnRequestData, RequestStatus } from "../../hooks/UseENA/types";

export interface Props {
  onClose: () => void;
  onContinue: () => void;
  onRequestData: OnRequestData;
  open: boolean;
  requestStatus: RequestStatus;
}
