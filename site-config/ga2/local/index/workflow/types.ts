import {
  Workflow,
  WorkflowCategory,
} from "../../../../../app/apis/catalog/brc-analytics-catalog/common/entities";
import { Assembly } from "../../../../../app/views/WorkflowInputsView/types";

export type WorkflowEntity = Workflow &
  Pick<WorkflowCategory, "category"> & {
    assembly: Pick<
      Assembly,
      | "taxonomicLevelClass"
      | "taxonomicLevelDomain"
      | "taxonomicLevelFamily"
      | "taxonomicLevelGenus"
      | "taxonomicLevelKingdom"
      | "taxonomicLevelOrder"
      | "taxonomicLevelPhylum"
      | "taxonomicLevelSpecies"
    > & {
      // `commonName` is not on GA2AssemblyEntity, so we add it here for type-safety. For GA2 assemblies, this will always be "Unspecified".
      commonName: string;
      // `taxonomicLevelRealm` is not present on GA2 assemblies, but we include it here for type-safety and set it to "Unspecified" for GA2 assemblies.
      taxonomicLevelRealm: string;
    };
    disabled?: boolean;
  };
