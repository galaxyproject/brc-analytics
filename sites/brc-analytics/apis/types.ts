import { type BRCDataCatalogGenome } from "./assembly";
import { type BRCDataCatalogOrganism } from "./organism";
import { type Outbreak } from "./outbreak";

export type BRCCatalog =
  | BRCDataCatalogGenome
  | BRCDataCatalogOrganism
  | Outbreak;
