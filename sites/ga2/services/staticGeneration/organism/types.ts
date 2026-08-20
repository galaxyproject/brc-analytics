import { type GA2OrganismEntity } from "@ga2/apis/organism";
import { type WorkflowCategory } from "@repo/shared/apis/workflow";

export interface GA2OrganismDetail extends GA2OrganismEntity {
  workflowCategories: WorkflowCategory[];
}
