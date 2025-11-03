import { Table } from "@tanstack/react-table";
import { Track } from "../TracksSelector/hooks/UseTable/types";

export interface Props {
  onClear: () => void;
  onEdit: () => void;
  selectedCount: number;
  table: Table<Track>;
}
