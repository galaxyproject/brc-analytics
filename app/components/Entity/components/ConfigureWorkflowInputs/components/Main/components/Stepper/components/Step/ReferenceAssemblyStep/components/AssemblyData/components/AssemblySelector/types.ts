import { Table } from "@tanstack/react-table";
import { Assembly } from "./hooks/UseTable/types";

export interface Props {
  onClose: () => void;
  open: boolean;
  table: Table<Assembly>;
}
