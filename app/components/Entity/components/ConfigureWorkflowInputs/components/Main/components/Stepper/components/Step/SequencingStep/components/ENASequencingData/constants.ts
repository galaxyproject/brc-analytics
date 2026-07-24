import { SEQUENCING_DATA_TYPE } from "@/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/types";
import { ReadRun } from "./types";

export const ENA_PORTAL_API_BASE_URL = `${process.env.NEXT_PUBLIC_ENA_PROXY_DOMAIN}/ena/portal/api`;

export const LIBRARY_LAYOUT_TO_CONFIGURE_INPUT_KEY: Record<
  ReadRun["library_layout"],
  SEQUENCING_DATA_TYPE
> = {
  PAIRED: SEQUENCING_DATA_TYPE.READ_RUNS_PAIRED,
  SINGLE: SEQUENCING_DATA_TYPE.READ_RUNS_SINGLE,
};
