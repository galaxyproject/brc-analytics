import { type BRCDataCatalogGenome } from "@brc/apis/assembly";
import { type GA2AssemblyEntity } from "@ga2/apis/assembly";

export type Assembly = BRCDataCatalogGenome | GA2AssemblyEntity;

export interface Props {
  entityId: string;
  entityListType?: string;
  trsId: string;
}
