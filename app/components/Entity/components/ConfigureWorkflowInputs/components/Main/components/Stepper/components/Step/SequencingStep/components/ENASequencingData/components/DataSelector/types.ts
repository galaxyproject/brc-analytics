import { ENAReadRunsQuery } from "@/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/components/ENASequencingData/types";

export interface Props {
  enaTaxonomyId: ENAReadRunsQuery;
  onContinue: () => void;
  onOpen: () => void;
  selectedCount: number;
  taxonomyCount?: number;
  taxonomyMatches: number;
}
