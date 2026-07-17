import { STEPPER_PROPS } from "@brc-analytics/core/components/ConfigureWorkflowInputs/components/Main/components/Stepper/constants";
import { StyledStepper } from "@brc-analytics/core/components/ConfigureWorkflowInputs/components/Main/components/Stepper/stepper.styles";
import { JSX } from "react";
import { Props } from "./types";

export const Stepper = ({
  activeStep,
  configuredSteps,
  onContinue,
  onEdit,
  workflow,
  ...props
}: Props): JSX.Element => {
  return (
    <StyledStepper
      activeStep={activeStep}
      {...STEPPER_PROPS}
      data-testid="workflow-stepper"
    >
      {configuredSteps.map(({ description, disabled, key, label, Step }, i) => {
        const active = activeStep === i;
        const completed = activeStep > i;
        return (
          <Step
            key={i}
            active={active}
            completed={completed}
            description={description}
            disabled={disabled}
            entryLabel={label}
            index={i}
            onContinue={onContinue}
            onEdit={onEdit}
            stepKey={key}
            workflow={workflow}
            {...props}
          />
        );
      })}
    </StyledStepper>
  );
};
