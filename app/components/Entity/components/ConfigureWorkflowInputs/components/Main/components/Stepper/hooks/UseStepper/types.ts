export type OnStep = (step?: number) => void;

export interface UseStepper {
  activeStep: number;
  onStep: OnStep;
}
