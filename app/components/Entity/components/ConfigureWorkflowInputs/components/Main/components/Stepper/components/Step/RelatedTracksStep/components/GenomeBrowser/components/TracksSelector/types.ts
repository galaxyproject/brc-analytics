import { Table } from "@tanstack/react-table";
import { StepProps } from "../../../../../types";
import { Track } from "./hooks/UseTable/types";

export interface Props extends Pick<StepProps, "onConfigure" | "stepKey"> {
  onClose: () => void;
  open: boolean;
  selectedCount: number;
  table: Table<Track>;
}
