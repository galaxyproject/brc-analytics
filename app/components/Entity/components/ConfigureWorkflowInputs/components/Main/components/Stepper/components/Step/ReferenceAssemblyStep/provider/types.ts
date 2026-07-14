import { StepProps } from "@/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/types";

export type StepContextValue = Pick<
  StepProps,
  "onConfigure" | "onContinue" | "stepKey"
>;
