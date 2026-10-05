import { type BRCDataCatalogOrganism } from "@brc/apis/organism";
import { type Pangenome } from "@brc/apis/pangenome";
import { type WithWorkflowCategories } from "@repo/shared/services/staticGeneration/workflows/types";

export interface BRCOrganismDetail extends WithWorkflowCategories<BRCDataCatalogOrganism> {
  pangenome?: Pangenome;
}
