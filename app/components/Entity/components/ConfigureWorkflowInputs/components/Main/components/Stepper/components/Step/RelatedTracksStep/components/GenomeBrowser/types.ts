import { Table } from "@tanstack/react-table";
import { StepProps } from "../../../types";
import { Track } from "./components/TracksSelector/hooks/UseTable/types";

export interface Props extends Pick<StepProps, "onConfigure" | "stepKey"> {
  table: Table<Track>;
}
