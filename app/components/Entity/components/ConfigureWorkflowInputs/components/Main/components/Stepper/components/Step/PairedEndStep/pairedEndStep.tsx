import { Step } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/step";
import { StepContent } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepContent/stepContent";
import { StepLabel } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepLabel/stepLabel";
import { StepProps } from "../types";
import { Optional } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepLabel/components/Optional/optional";

export const PairedEndStep = ({
  active,
  completed,
  entryLabel,
  index,
}: StepProps): JSX.Element => {
  return (
    <Step active={active} completed={completed} index={index}>
      <StepLabel optional={<Optional>TODO</Optional>}>{entryLabel}</StepLabel>
      <StepContent>TODO</StepContent>
    </Step>
  );
};
