import { ReadRun } from "../../types";

export interface Props {
  readRuns: ReadRun[];
  onClose: () => void;
  open: boolean;
}
