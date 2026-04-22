import { Table } from "@tanstack/react-table";
import { UcscTrackNode } from "../../../../../../../../../../../../../../../utils/ucsc-tracks-api/entities";
import { StepProps } from "../../../../../types";

export interface Props extends Pick<StepProps, "onConfigure" | "stepKey"> {
  onClose: () => void;
  open: boolean;
  selectedCount: number;
  table: Table<UcscTrackNode>;
}
