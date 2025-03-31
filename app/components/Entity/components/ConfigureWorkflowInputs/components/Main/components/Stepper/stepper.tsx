import { STEPPER_PROPS, STEPS } from "./constants";
import { StyledStepper } from "./stepper.styles";
import { Props } from "./types";

export const Stepper = (props: Props): JSX.Element => {
  const activeStep = 1;
  return (
    <StyledStepper activeStep={activeStep} {...STEPPER_PROPS}>
      {STEPS.map(({ key, Step, ...stepProps }, i) => {
        const active = activeStep === i;
        const completed = activeStep > i;
        return (
          <Step
            key={key}
            active={active}
            completed={completed}
            configKey={key}
            {...stepProps}
            {...props}
          />
        );
      })}
    </StyledStepper>
  );
};
