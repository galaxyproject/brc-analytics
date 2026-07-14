import { StepProps } from "@/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/types";

export interface Props extends Pick<StepProps, "configuredInput"> {
  onOpen: () => void;
}
