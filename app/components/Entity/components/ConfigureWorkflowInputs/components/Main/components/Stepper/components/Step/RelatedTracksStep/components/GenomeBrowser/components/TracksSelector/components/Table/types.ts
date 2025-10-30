import { Row, Table } from "@tanstack/react-table";
import { Track } from "../../hooks/UseTable/types";

export interface Props {
  row: Row<Track>;
  table: Table<Track>;
}
