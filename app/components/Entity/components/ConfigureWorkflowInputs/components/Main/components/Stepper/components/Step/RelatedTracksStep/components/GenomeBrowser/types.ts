import { Table } from "@tanstack/react-table";
import { StepProps } from "../../../types";
import { UcscTrackNode } from "../../../../../../../../../../../../../utils/ucsc-tracks-api/entities";

export interface Props extends Pick<StepProps, "onConfigure" | "stepKey"> {
  table: Table<UcscTrackNode>;
}
