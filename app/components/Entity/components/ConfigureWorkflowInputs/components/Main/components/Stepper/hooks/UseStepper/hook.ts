import { useCallback, useState } from "react";
import { UseStepper } from "./types";
import { getInitialActiveStep, getNextActiveStep } from "./utils";
import { StepConfig } from "../../components/Step/types";

export const useStepper = (steps: StepConfig[]): UseStepper => {
  const [activeStep, setActiveStep] = useState<number>(
    getInitialActiveStep(steps)
  );

  const onContinue = useCallback((): void => {
    setActiveStep((currentStep) => getNextActiveStep(steps, currentStep));
  }, [steps]);

  const onEdit = useCallback(
    (step: number): void => {
      setActiveStep(step);
    },
    [steps]
  );

  return { activeStep, onContinue, onEdit };
};
