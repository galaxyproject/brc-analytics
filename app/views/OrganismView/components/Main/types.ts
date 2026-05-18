import { DetailViewTable } from "@databiosphere/findable-ui/lib/components/Detail/components/DetailViewTable/detailViewTable";
import type { ComponentProps } from "react";
import type { Organism } from "../../types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- table is generic over row data
export type AssembliesTableProps = ComponentProps<typeof DetailViewTable<any>>;

export interface Props {
  entityId: string;
  organism: Organism;
  tableProps: AssembliesTableProps;
}
