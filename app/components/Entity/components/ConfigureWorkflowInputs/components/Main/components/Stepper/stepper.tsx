import { STEPPER_PROPS, STEPS } from "./constants";
import { StyledStepper } from "./stepper.styles";
import { Props } from "./types";
import { useStepper } from "./hooks/UseStepper/hook";

const steps = STEPS;

export const Stepper = ({ workflow, ...props }: Props): JSX.Element => {
  const { activeStep, onContinue, onEdit } = useStepper(steps);
  return (
    <StyledStepper activeStep={activeStep} {...STEPPER_PROPS}>
      {steps.map(({ label, Step, ...stepProps }, i) => {
        const active = activeStep === i;
        const completed = activeStep > i;
        return (
          <Step
            key={i}
            active={active}
            completed={completed}
            entryLabel={label}
            index={i}
            onContinue={onContinue}
            onEdit={onEdit}
            workflow={workflow}
            {...stepProps}
            {...props}
          />
        );
      })}
    </StyledStepper>
  );
};
