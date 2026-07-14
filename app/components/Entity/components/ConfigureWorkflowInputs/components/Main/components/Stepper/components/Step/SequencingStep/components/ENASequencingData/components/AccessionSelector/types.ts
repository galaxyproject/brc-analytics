import {
  OnRequestData,
  Status,
} from "@/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/components/ENASequencingData/hooks/UseENADataByAccession/types";
import { BaseReadRun } from "@/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/components/ENASequencingData/types";

export interface Props {
  clearErrors: () => void;
  enaAccessionStatus: Status;
  onClose: () => void;
  onContinue: () => void;
  onRequestData: OnRequestData<BaseReadRun>;
  open: boolean;
  switchBrowseMethod: (data?: BaseReadRun[]) => void;
}
