import {
  type BaseReadRun,
  type ReadRun,
} from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/components/ENASequencingData/types";
import { type Table } from "@tanstack/react-table";

export interface Actions {
  switchBrowseMethod: (data?: BaseReadRun[]) => void;
}
export interface UseTable {
  actions: Actions;
  table: Table<ReadRun>;
}
