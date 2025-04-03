import { STEPPER_PROPS, STEPS } from "./constants";
import { StyledStepper } from "./stepper.styles";
import { Props } from "./types";
import { useStepper } from "./hooks/UseStepper/hook";

const steps = STEPS;

export const Stepper = ({ workflow, ...props }: Props): JSX.Element => {
  const { activeStep, onStep } = useStepper(steps);
  return (
    <StyledStepper activeStep={activeStep} {...STEPPER_PROPS}>
      {steps.map(({ key, label, Step, ...stepProps }, i) => {
        const active = activeStep === i;
        const completed = activeStep > i;
        return (
          <Step
            key={key}
            active={active}
            completed={completed}
            entryKey={key}
            entryLabel={label}
            onStep={onStep}
            workflow={workflow}
            {...stepProps}
            {...props}
          />
        );
      })}
    </StyledStepper>
  );
};
