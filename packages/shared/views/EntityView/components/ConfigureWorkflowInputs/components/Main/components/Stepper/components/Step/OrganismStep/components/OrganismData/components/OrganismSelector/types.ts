import { type Table } from "@tanstack/react-table";
import { type Organism } from "./hooks/UseTable/types";

export interface Props {
  onClose: () => void;
  open: boolean;
  table: Table<Organism>;
}
