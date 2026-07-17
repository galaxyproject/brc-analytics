import { StepConfig } from "@/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/types";
import { UseStepper } from "@brc-analytics/core/components/ConfigureWorkflowInputs/components/Main/components/Stepper/hooks/UseStepper/types";
import { useCallback, useState } from "react";
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
