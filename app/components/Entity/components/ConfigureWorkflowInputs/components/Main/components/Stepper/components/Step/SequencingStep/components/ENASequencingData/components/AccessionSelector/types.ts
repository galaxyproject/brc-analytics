import { OnRequestData, Status } from "../../hooks/UseENA/types";

export interface Props {
  clearErrors: () => void;
  onClose: () => void;
  onContinue: () => void;
  onRequestData: OnRequestData;
  open: boolean;
  status: Status;
}
