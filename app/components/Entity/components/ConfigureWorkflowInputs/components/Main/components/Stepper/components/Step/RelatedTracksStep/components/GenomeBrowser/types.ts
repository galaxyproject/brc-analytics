import { type StepProps } from "@/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/types";
import { type UcscTrackNode } from "@repo/shared/utils/ucsc-tracks-api/types";
import { type Table } from "@tanstack/react-table";

export interface Props extends Pick<StepProps, "onConfigure" | "stepKey"> {
  table: Table<UcscTrackNode>;
}
