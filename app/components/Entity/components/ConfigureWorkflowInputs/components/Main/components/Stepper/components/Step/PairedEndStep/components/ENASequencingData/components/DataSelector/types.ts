import {
  ClearErrors,
  OnRequestData,
  RequestStatus,
} from "../../hooks/UseENA/types";

export interface Props {
  clearErrors: ClearErrors;
  onRequestData: OnRequestData;
  requestStatus: RequestStatus;
  onSelect: () => void;
}
