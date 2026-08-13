import { type ENAReadRunsQuery } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/components/ENASequencingData/types";

export interface Props {
  enaTaxonomyId: ENAReadRunsQuery;
  taxonomyMatches: number;
}
