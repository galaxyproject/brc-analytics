import { SEQUENCING_DATA_TYPE } from "../../types";
import { ReadRun } from "./types";

export const LIBRARY_LAYOUT_TO_CONFIGURE_INPUT_KEY: Record<
  ReadRun["library_layout"],
  SEQUENCING_DATA_TYPE
> = {
  PAIRED: SEQUENCING_DATA_TYPE.READ_RUNS_PAIRED,
  SINGLE: SEQUENCING_DATA_TYPE.READ_RUNS_SINGLE,
};
