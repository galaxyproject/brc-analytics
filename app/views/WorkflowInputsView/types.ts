import { type BRCDataCatalogGenome } from "@brc/apis/types";
import { type GA2AssemblyEntity } from "@ga2/apis/types";

export type Assembly = BRCDataCatalogGenome | GA2AssemblyEntity;

export interface Props {
  entityId: string;
  entityListType?: string;
  trsId: string;
}
