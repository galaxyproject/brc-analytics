import { type Pangenome } from "@brc/apis/pangenome";
import { type Props as SharedProps } from "@repo/shared/views/OrganismView/components/Main/types";
import { type RowData } from "@tanstack/react-table";

export type Props<T extends RowData> = SharedProps<T> & {
  pangenome?: Pangenome;
};
