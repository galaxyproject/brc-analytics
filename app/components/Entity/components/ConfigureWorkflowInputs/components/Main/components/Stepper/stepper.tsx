import { STEPPER_PROPS, STEPS } from "./constants";
import { StyledStepper } from "./stepper.styles";
import { Props } from "./types";

export const Stepper = ({ workflow, ...props }: Props): JSX.Element => {
  const activeStep = 1;
  return (
    <StyledStepper activeStep={activeStep} {...STEPPER_PROPS}>
      {STEPS.map(({ key, label, Step, ...stepProps }, i) => {
        const active = activeStep === i;
        const completed = activeStep > i;
        return (
          <Step
            key={key}
            active={active}
            completed={completed}
            entryKey={key}
            entryLabel={label}
            workflow={workflow}
            {...stepProps}
            {...props}
          />
        );
      })}
    </StyledStepper>
  );
};
