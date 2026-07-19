import { StepConfig } from "@/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/types";
import { useCallback, useState } from "react";
import { UseStepper } from "./types";
import { getInitialActiveStep, getNextActiveStep } from "./utils";

export const useStepper = (
  steps: StepConfig[],
  initialActiveStepOverride?: number
): UseStepper => {
  const [activeStep, setActiveStep] = useState<number>(
    initialActiveStepOverride ?? getInitialActiveStep(steps)
  );

  const onContinue = useCallback((): void => {
    setActiveStep((currentStep) => getNextActiveStep(steps, currentStep));
  }, [steps]);

  const onEdit = useCallback((step: number): void => {
    setActiveStep(step);
  }, []);

  return { activeStep, onContinue, onEdit };
};
