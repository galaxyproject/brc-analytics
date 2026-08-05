import { type StepProps } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/types";

export type StepContextValue = Pick<
  StepProps,
  "onConfigure" | "onContinue" | "stepKey"
>;
