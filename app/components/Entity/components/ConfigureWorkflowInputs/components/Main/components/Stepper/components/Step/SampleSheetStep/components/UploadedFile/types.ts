import { UseFilePicker } from "../../hooks/UseFilePicker/types";

export interface Props {
  errors?: string[];
  file: File | null;
  onClear: UseFilePicker["actions"]["onClear"];
}
