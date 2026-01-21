import { STEPPER_PROPS } from "./constants";
import { StyledStepper } from "./stepper.styles";
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
    <StyledStepper activeStep={activeStep} {...STEPPER_PROPS}>
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
