import { useCallback, useState } from "react";
import { StepConfig } from "../../components/Step/types";
import { UseStepper } from "./types";
import { getInitialActiveStep, getNextActiveStep } from "./utils";

export const useStepper = (steps: StepConfig[]): UseStepper => {
  const [activeStep, setActiveStep] = useState<number>(
    getInitialActiveStep(steps)
  );

  const onContinue = useCallback((): void => {
    setActiveStep((currentStep) => getNextActiveStep(steps, currentStep));
  }, [steps]);

  const onEdit = useCallback((step: number): void => {
    setActiveStep(step);
  }, []);

  return { activeStep, onContinue, onEdit };
};
