import { type UcscTrackNode } from "@repo/shared/utils/ucsc-tracks-api/types";
import { type StepProps } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/types";
import { type Table } from "@tanstack/react-table";

export interface Props extends Pick<StepProps, "onConfigure" | "stepKey"> {
  table: Table<UcscTrackNode>;
}
