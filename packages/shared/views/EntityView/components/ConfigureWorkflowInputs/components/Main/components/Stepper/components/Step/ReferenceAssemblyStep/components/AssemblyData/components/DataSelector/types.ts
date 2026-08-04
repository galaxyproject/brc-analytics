import { type StepProps } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/types";

export interface Props extends Pick<StepProps, "configuredInput"> {
  onOpen: () => void;
}
