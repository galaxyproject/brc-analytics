import { STEPPER_PROPS } from "./constants";
import { StyledStepper } from "./stepper.styles";
import { Props } from "./types";
import { useStepper } from "./hooks/UseStepper/hook";

export const Stepper = ({
  configuredSteps,
  workflow,
  ...props
}: Props): JSX.Element => {
  const { activeStep, onContinue, onEdit } = useStepper(configuredSteps);
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
