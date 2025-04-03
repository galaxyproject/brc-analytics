import { useCallback, useState } from "react";
import { UseStepper } from "./types";
import { getInitialActiveStep, getNextActiveStep } from "./utils";
import { StepConfig } from "../../components/Step/types";

export const useStepper = (steps: StepConfig[]): UseStepper => {
  const [activeStep, setActiveStep] = useState<number>(
    getInitialActiveStep(steps)
  );

  const onStep = useCallback(
    (step?: number): void => {
      setActiveStep((currentStep) =>
        step ? step : getNextActiveStep(steps, currentStep)
      );
    },
    [steps]
  );

  return { activeStep, onStep };
};
