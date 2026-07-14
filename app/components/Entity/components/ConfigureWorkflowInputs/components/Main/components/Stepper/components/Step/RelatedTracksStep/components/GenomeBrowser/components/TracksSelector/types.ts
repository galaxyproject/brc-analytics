import { StepProps } from "@/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/types";
import { UcscTrackNode } from "@/utils/ucsc-tracks-api/entities";
import { Table } from "@tanstack/react-table";

export interface Props extends Pick<StepProps, "onConfigure" | "stepKey"> {
  onClose: () => void;
  open: boolean;
  selectedCount: number;
  table: Table<UcscTrackNode>;
}
