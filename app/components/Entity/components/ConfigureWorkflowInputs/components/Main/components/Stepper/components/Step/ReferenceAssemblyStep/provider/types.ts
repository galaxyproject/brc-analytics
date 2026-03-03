import { StepProps } from "../../types";

export type StepContextValue = Pick<
  StepProps,
  "onConfigure" | "onContinue" | "stepKey"
>;
