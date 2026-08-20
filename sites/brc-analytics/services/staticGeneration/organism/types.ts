import { type BRCDataCatalogOrganism } from "@brc/apis/organism";
import { type Pangenome } from "@brc/apis/pangenome";
import { type WorkflowCategory } from "@repo/shared/apis/workflow";

export interface BRCOrganismDetail extends BRCDataCatalogOrganism {
  pangenome?: Pangenome;
  workflowCategories: WorkflowCategory[];
}
