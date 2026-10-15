import type { OrganismContract } from "@repo/shared/apis/types";
import { type Table } from "@tanstack/react-table";

export type Organism = OrganismContract;

export interface UseTable {
  table: Table<Organism>;
}
