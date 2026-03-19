import {
  BRCDataCatalogOrganism,
  Workflow,
  WorkflowCategory,
} from "../../apis/catalog/brc-analytics-catalog/common/entities";
import { GA2OrganismEntity } from "../../apis/catalog/ga2/entities";
import { Assembly } from "../WorkflowInputsView/types";

export type BaseWorkflowAssembly = Pick<
  Assembly,
  | "taxonomicLevelClass"
  | "taxonomicLevelDomain"
  | "taxonomicLevelFamily"
  | "taxonomicLevelGenus"
  | "taxonomicLevelKingdom"
  | "taxonomicLevelOrder"
  | "taxonomicLevelPhylum"
  | "taxonomicLevelSpecies"
>;

/**
 * Full assembly type including site-specific fields that are always computed
 * at runtime but only typed on site-specific WorkflowEntity extensions.
 */
export type WorkflowAssembly = BaseWorkflowAssembly & {
  commonName: string;
  taxonomicLevelRealm: string;
};

export type Organism = BRCDataCatalogOrganism | GA2OrganismEntity;

export type WorkflowEntity = Workflow &
  Pick<WorkflowCategory, "category"> & {
    assembly: BaseWorkflowAssembly;
    disabled?: boolean;
  };
