import type { AssemblyContract } from "@repo/shared/apis/types";
import type { Workflow, WorkflowCategory } from "@repo/shared/apis/workflow";

export type BaseWorkflowAssembly = Pick<
  AssemblyContract,
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
  commonNames: string[];
  taxonomicLevelRealm: string;
};

export type WorkflowEntity = Workflow &
  Pick<WorkflowCategory, "category"> & {
    assembly: BaseWorkflowAssembly;
    disabled?: boolean;
    scope: string;
  };
