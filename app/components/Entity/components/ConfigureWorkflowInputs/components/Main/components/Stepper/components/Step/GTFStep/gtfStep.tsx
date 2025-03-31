import { StepContent } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepContent/stepContent";
import { StepLabel } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepLabel/stepLabel";
import { Icon } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepLabel/components/Label/components/Icon/icon";
import { LOREM_IPSUM } from "@databiosphere/findable-ui/lib/storybook/loremIpsum";
import { StepProps } from "../types";
import { Step } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/step";

export const GTFStep = ({
  active,
  completed,
  description,
  index,
  label,
}: StepProps): JSX.Element => {
  return (
    <Step active={active} completed={completed} index={index}>
      <StepLabel>
        {label}
        <Icon slotProps={{ tooltip: { title: description } }} />
      </StepLabel>
      <StepContent>{LOREM_IPSUM.LONG}</StepContent>
    </Step>
  );
};
